import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all contacts with hospital and job title relations
 */
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const hospitalId = req.query.hospitalId as string;
    const jobTitleId = req.query.jobTitleId as string;

    // Build where clause
    const where: any = {};

    if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (jobTitleId) {
      where.jobTitleId = jobTitleId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          hospital: {
            select: {
              id: true,
              hastaneAdi: true,
              il: true,
              type: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              },
              subtype: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              },
              city: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          jobTitle: {
            select: {
              id: true,
              title: true,
              displayName: true,
              slug: true
            }
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

/**
 * Get contact by ID with full relations
 */
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
            city: true
          }
        },
        jobTitle: true
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

/**
 * Create new contact
 */
export const createContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, email, notes, jobTitleId, hospitalId } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    // Verify jobTitle exists if provided
    if (jobTitleId) {
      const jobTitle = await prisma.jobTitle.findUnique({
        where: { id: jobTitleId }
      });
      if (!jobTitle) {
        return res.status(404).json({ error: 'Job title not found' });
      }
    }

    // Verify hospital exists if provided
    if (hospitalId) {
      const hospital = await prisma.hospitalReference.findUnique({
        where: { id: hospitalId }
      });
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        notes,
        jobTitleId,
        hospitalId
      },
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
            city: true
          }
        },
        jobTitle: true
      }
    });

    res.status(201).json(contact);
  } catch (error: any) {
    console.error('Error creating contact:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid foreign key reference' });
    }

    res.status(500).json({ error: 'Failed to create contact' });
  }
};

/**
 * Update contact
 */
export const updateContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, email, notes, jobTitleId, hospitalId } = req.body;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify jobTitle exists if provided
    if (jobTitleId !== undefined && jobTitleId !== null) {
      const jobTitle = await prisma.jobTitle.findUnique({
        where: { id: jobTitleId }
      });
      if (!jobTitle) {
        return res.status(404).json({ error: 'Job title not found' });
      }
    }

    // Verify hospital exists if provided
    if (hospitalId !== undefined && hospitalId !== null) {
      const hospital = await prisma.hospitalReference.findUnique({
        where: { id: hospitalId }
      });
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }
    }

    // Build update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;
    if (jobTitleId !== undefined) updateData.jobTitleId = jobTitleId;
    if (hospitalId !== undefined) updateData.hospitalId = hospitalId;

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        hospital: {
          include: {
            type: true,
            subtype: true,
            city: true
          }
        },
        jobTitle: true
      }
    });

    res.json(contact);
  } catch (error: any) {
    console.error('Error updating contact:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid foreign key reference' });
    }

    res.status(500).json({ error: 'Failed to update contact' });
  }
};

/**
 * Delete contact
 */
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting contact:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

/**
 * Get contact statistics
 */
export const getContactStats = async (req: Request, res: Response) => {
  try {
    const total = await prisma.contact.count();

    const withEmail = await prisma.contact.count({
      where: { email: { not: null } }
    });

    const withPhone = await prisma.contact.count({
      where: { phone: { not: null } }
    });

    const withHospital = await prisma.contact.count({
      where: { hospitalId: { not: null } }
    });

    const withJobTitle = await prisma.contact.count({
      where: { jobTitleId: { not: null } }
    });

    const withNotes = await prisma.contact.count({
      where: { notes: { not: null } }
    });

    res.json({
      total,
      withEmail,
      withPhone,
      withHospital,
      withJobTitle,
      withNotes,
      withoutHospital: total - withHospital,
      withoutJobTitle: total - withJobTitle
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
