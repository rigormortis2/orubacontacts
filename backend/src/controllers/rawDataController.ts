import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all raw data
export const getAllRawData = async (req: Request, res: Response) => {
  try {
    const rawData = await prisma.rawData.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(rawData);
  } catch (error) {
    console.error('Error fetching raw data:', error);
    res.status(500).json({ error: 'Raw data alınırken hata oluştu' });
  }
};

// Get raw data by ID
export const getRawDataById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawData = await prisma.rawData.findUnique({
      where: { id },
    });

    if (!rawData) {
      return res.status(404).json({ error: 'Raw data bulunamadı' });
    }

    res.json(rawData);
  } catch (error) {
    console.error('Error fetching raw data:', error);
    res.status(500).json({ error: 'Raw data alınırken hata oluştu' });
  }
};

// Create new raw data
export const createRawData = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rawData = await prisma.rawData.create({
      data: req.body,
    });

    res.status(201).json(rawData);
  } catch (error: any) {
    console.error('Error creating raw data:', error);
    res.status(500).json({ error: 'Raw data oluşturulurken hata oluştu' });
  }
};

// Update raw data
export const updateRawData = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const rawData = await prisma.rawData.update({
      where: { id },
      data: req.body,
    });

    res.json(rawData);
  } catch (error: any) {
    console.error('Error updating raw data:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Raw data bulunamadı' });
    }
    res.status(500).json({ error: 'Raw data güncellenirken hata oluştu' });
  }
};

// Delete raw data
export const deleteRawData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.rawData.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting raw data:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Raw data bulunamadı' });
    }
    res.status(500).json({ error: 'Raw data silinirken hata oluştu' });
  }
};
