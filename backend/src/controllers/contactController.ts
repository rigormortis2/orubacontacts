import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all contacts with hospital relations
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
          },
        },
      },
      orderBy: [
        { trelloBaslik: 'asc' },
      ],
    });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Contacts alınırken hata oluştu' });
  }
};

// Get contact statistics
export const getContactStats = async (req: Request, res: Response) => {
  try {
    const total = await prisma.contact.count();

    // Hospital ilişkisi olan/olmayan kayıt sayısı
    const withHospital = await prisma.contact.count({
      where: { hospitalId: { not: null } },
    });

    const withoutHospital = total - withHospital;

    // Type dağılımı (hospital ilişkisi üzerinden)
    const kamuCount = await prisma.contact.count({
      where: {
        hospital: {
          type: {
            name: 'kamu',
          },
        },
      },
    });

    const ozelCount = await prisma.contact.count({
      where: {
        hospital: {
          type: {
            name: 'özel',
          },
        },
      },
    });

    res.json({
      total,
      withHospital,
      withoutHospital,
      byType: {
        kamu: kamuCount,
        özel: ozelCount,
      },
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu' });
  }
};

// Get contact by ID with hospital relations
export const getContactById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact bulunamadı' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Contact alınırken hata oluştu' });
  }
};

// Create new contact
export const createContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contact = await prisma.contact.create({
      data: req.body,
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
          },
        },
      },
    });

    res.status(201).json(contact);
  } catch (error: any) {
    console.error('Error creating contact:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu trello başlık zaten mevcut' });
    }
    res.status(500).json({ error: 'Contact oluşturulurken hata oluştu' });
  }
};

// Update contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const contact = await prisma.contact.update({
      where: { id },
      data: req.body,
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
          },
        },
      },
    });

    res.json(contact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contact bulunamadı' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu trello başlık zaten mevcut' });
    }
    res.status(500).json({ error: 'Contact güncellenirken hata oluştu' });
  }
};

// Delete contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contact bulunamadı' });
    }
    res.status(500).json({ error: 'Contact silinirken hata oluştu' });
  }
};
