import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Normalize and validate phone number
 * @param phone - Raw phone number string
 * @returns Normalized phone number (11 digits starting with 0)
 * @throws Error if phone format is invalid
 */
export const normalizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required and must be a string');
  }

  // Remove all spaces, dashes, parentheses, and other common separators
  let cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');

  // Remove any non-digit characters
  cleaned = cleaned.replace(/\D/g, '');

  // If phone doesn't start with 0, add it
  if (cleaned.length > 0 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  // Validate format: exactly 11 digits starting with 0
  if (cleaned.length !== 11) {
    throw new Error(`Invalid phone format: expected 11 digits (0xxxxxxxxxx), got ${cleaned.length} digits: ${cleaned}`);
  }

  if (!cleaned.startsWith('0')) {
    throw new Error(`Invalid phone format: must start with 0, got: ${cleaned}`);
  }

  // Additional validation: ensure it's all digits
  if (!/^0\d{10}$/.test(cleaned)) {
    throw new Error(`Invalid phone format: must contain only digits (0xxxxxxxxxx), got: ${cleaned}`);
  }

  return cleaned;
};

export const getPhones = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const rawDataId = req.query.rawDataId as string;
    const sortByParam = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const skip = (page - 1) * limit;

    // Map database column names to Prisma field names
    const sortByMapping: Record<string, string> = {
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
      'phone_number': 'phoneNumber',
      'trello_title': 'trelloTitle',
      'raw_data_id': 'rawDataId',
    };
    const sortBy = sortByMapping[sortByParam] || sortByParam;

    // Build where clause
    const where: any = {};

    // Filter by rawDataId if provided
    if (rawDataId) {
      where.rawDataId = rawDataId;
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { trelloTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.phone.count({ where });

    // Get phones
    const phones = await prisma.phone.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        rawData: {
          select: {
            title: true,
            shortUrl: true,
          },
        },
      },
    });

    res.json({
      data: phones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching phones:', error);
    res.status(500).json({ error: 'Failed to fetch phones' });
  }
};

export const getPhoneStats = async (req: Request, res: Response) => {
  try {
    const total = await prisma.phone.count();
    const unique = await prisma.phone.groupBy({
      by: ['phoneNumber'],
    });

    res.json({
      total,
      unique: unique.length,
    });
  } catch (error) {
    console.error('Error fetching phone stats:', error);
    res.status(500).json({ error: 'Failed to fetch phone stats' });
  }
};

/**
 * POST /api/phones
 * Create a new phone record
 */
export const createPhone = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, rawDataId, trelloTitle } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!rawDataId) {
      return res.status(400).json({ error: 'Raw data ID is required' });
    }

    // Normalize and validate phone number
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(phoneNumber);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        details: error.message
      });
    }

    // Check if phone already exists
    const existing = await prisma.phone.findUnique({
      where: { phoneNumber: normalizedPhone }
    });

    if (existing) {
      return res.json({ phone: existing });
    }

    // Get trello title from raw data if not provided
    let title = trelloTitle;
    if (!title && rawDataId) {
      const rawData = await prisma.rawData.findUnique({
        where: { id: rawDataId },
        select: { title: true }
      });
      title = rawData?.title || 'Unknown';
    }

    // Create phone
    const phone = await prisma.phone.create({
      data: {
        phoneNumber: normalizedPhone,
        rawDataId,
        trelloTitle: title,
        isMatched: false
      }
    });

    return res.json({ phone });
  } catch (error) {
    console.error('Error creating phone:', error);
    return res.status(500).json({ error: 'Failed to create phone' });
  }
};
