import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Normalize and validate email address
 * @param email - Raw email address string
 * @returns Normalized email address (lowercase, trimmed)
 * @throws Error if email format is invalid
 */
export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    throw new Error('Email address is required and must be a string');
  }

  // Trim leading/trailing spaces
  let cleaned = email.trim();

  // Remove any middle spaces (shouldn't exist in valid emails)
  cleaned = cleaned.replace(/\s+/g, '');

  // Convert to lowercase
  cleaned = cleaned.toLowerCase();

  // Validate email format
  // Basic regex: requires @ symbol, domain, and TLD
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(cleaned)) {
    throw new Error(`Invalid email format: ${email}`);
  }

  // Additional validation: must have @ and at least one dot after @
  const atIndex = cleaned.indexOf('@');
  if (atIndex === -1) {
    throw new Error('Email must contain @ symbol');
  }

  const domainPart = cleaned.substring(atIndex + 1);
  if (!domainPart.includes('.')) {
    throw new Error('Email domain must contain at least one dot');
  }

  // Check for consecutive dots
  if (cleaned.includes('..')) {
    throw new Error('Email cannot contain consecutive dots');
  }

  // Check that @ is not at start or end
  if (atIndex === 0 || atIndex === cleaned.length - 1) {
    throw new Error('Email cannot start or end with @ symbol');
  }

  return cleaned;
};

export const getEmails = async (req: Request, res: Response) => {
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
      'email_address': 'emailAddress',
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
        { emailAddress: { contains: search, mode: 'insensitive' } },
        { trelloTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.email.count({ where });

    // Get emails
    const emails = await prisma.email.findMany({
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
      data: emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

export const getEmailStats = async (req: Request, res: Response) => {
  try {
    const total = await prisma.email.count();
    const unique = await prisma.email.groupBy({
      by: ['emailAddress'],
    });

    res.json({
      total,
      unique: unique.length,
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Failed to fetch email stats' });
  }
};

/**
 * POST /api/emails
 * Create a new email record
 */
export const createEmail = async (req: Request, res: Response) => {
  try {
    const { emailAddress, rawDataId, trelloTitle } = req.body;

    // Validation
    if (!emailAddress) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    if (!rawDataId) {
      return res.status(400).json({ error: 'Raw data ID is required' });
    }

    // Normalize and validate email address
    let normalizedEmail: string;
    try {
      normalizedEmail = normalizeEmail(emailAddress);
    } catch (error: any) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: error.message
      });
    }

    // Check if email already exists
    const existing = await prisma.email.findUnique({
      where: { emailAddress: normalizedEmail }
    });

    if (existing) {
      return res.json({ email: existing });
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

    // Create email
    const email = await prisma.email.create({
      data: {
        emailAddress: normalizedEmail,
        rawDataId,
        trelloTitle: title,
        isMatched: false
      }
    });

    return res.json({ email });
  } catch (error) {
    console.error('Error creating email:', error);
    return res.status(500).json({ error: 'Failed to create email' });
  }
};
