import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lock timeout in minutes (release locks older than this)
const LOCK_TIMEOUT_MINUTES = 10;

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

/**
 * GET /api/matching/next
 * Get the next unmatched trello title for the user to work on
 * This endpoint locks the record for the user
 */
export const getNextUnmatched = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Release stale locks (older than LOCK_TIMEOUT_MINUTES)
    const lockTimeout = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000);
    await prisma.rawData.updateMany({
      where: {
        matchingInProgressBy: { not: null },
        matchingLockedAt: { lt: lockTimeout },
        isFullyMatched: false,
      },
      data: {
        matchingInProgressBy: null,
        matchingLockedAt: null,
      },
    });

    // Find an unmatched record that's not locked
    const unmatchedRecord = await prisma.rawData.findFirst({
      where: {
        isFullyMatched: false,
        matchingInProgressBy: null,
      },
      include: {
        phones: {
          where: { isMatched: false },
          orderBy: { phoneNumber: 'asc' },
        },
        emails: {
          where: { isMatched: false },
          orderBy: { emailAddress: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!unmatchedRecord) {
      return res.status(404).json({
        message: 'No unmatched records found',
        allComplete: true
      });
    }

    // Lock the record for this user
    const lockedRecord = await prisma.rawData.update({
      where: { id: unmatchedRecord.id },
      data: {
        matchingInProgressBy: username,
        matchingLockedAt: new Date(),
      },
      include: {
        phones: {
          where: { isMatched: false },
          orderBy: { phoneNumber: 'asc' },
        },
        emails: {
          where: { isMatched: false },
          orderBy: { emailAddress: 'asc' },
        },
      },
    });

    return res.json({
      id: lockedRecord.id, // Changed from rawDataId to id to match frontend expectations
      rawDataId: lockedRecord.id, // Keep for backward compatibility
      title: lockedRecord.title,
      description: lockedRecord.description,
      listName: lockedRecord.listName,
      phones: lockedRecord.phones,
      emails: lockedRecord.emails,
      totalUnmatched: lockedRecord.phones.length + lockedRecord.emails.length,
    });
  } catch (error) {
    console.error('Error getting next unmatched record:', error);
    return res.status(500).json({ error: 'Failed to get next unmatched record' });
  }
};

/**
 * POST /api/matching/assign
 * Create a contact and assign a phone or email to it
 * Body: {
 *   username: string
 *   phoneId?: string
 *   emailId?: string
 *   firstName: string
 *   lastName?: string
 *   jobTitleId?: string
 *   hospitalId?: string
 *   notes?: string
 * }
 */
export const assignContact = async (req: Request, res: Response) => {
  try {
    const {
      username,
      phoneId,
      emailId,
      firstName,
      lastName,
      jobTitleId,
      hospitalId,
      notes,
    } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!phoneId && !emailId) {
      return res.status(400).json({ error: 'Either phoneId or emailId is required' });
    }

    if (!firstName) {
      return res.status(400).json({ error: 'First name is required' });
    }

    // Verify the phone or email exists and is not already matched
    if (phoneId) {
      const phone = await prisma.phone.findUnique({ where: { id: phoneId } });
      if (!phone) {
        return res.status(404).json({ error: 'Phone not found' });
      }
      if (phone.isMatched) {
        return res.status(400).json({ error: 'Phone is already matched' });
      }
    }

    if (emailId) {
      const email = await prisma.email.findUnique({ where: { id: emailId } });
      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }
      if (email.isMatched) {
        return res.status(400).json({ error: 'Email is already matched' });
      }
    }

    // Get phone number and email address for the contact record
    let phoneNumber: string | null = null;
    let emailAddress: string | null = null;

    if (phoneId) {
      const phone = await prisma.phone.findUnique({ where: { id: phoneId } });
      phoneNumber = phone?.phoneNumber || null;
    }

    if (emailId) {
      const email = await prisma.email.findUnique({ where: { id: emailId } });
      emailAddress = email?.emailAddress || null;
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        phone: phoneNumber,
        email: emailAddress,
        notes: notes || null,
        jobTitleId: jobTitleId || null,
        hospitalId: hospitalId || null,
      },
    });

    // Update phone if provided
    if (phoneId) {
      await prisma.phone.update({
        where: { id: phoneId },
        data: {
          isMatched: true,
          matchedContactId: contact.id,
          matchedBy: username,
          matchedAt: new Date(),
        },
      });
    }

    // Update email if provided
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: {
          isMatched: true,
          matchedContactId: contact.id,
          matchedBy: username,
          matchedAt: new Date(),
        },
      });
    }

    return res.json({
      success: true,
      contact,
      message: 'Contact created and assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning contact:', error);
    return res.status(500).json({ error: 'Failed to assign contact' });
  }
};

/**
 * POST /api/matching/batch-assign
 * Create multiple contacts and assign phones/emails in a single transaction
 * Body: {
 *   username: string
 *   rawDataId: string
 *   contacts: Array<{
 *     firstName: string
 *     lastName?: string
 *     jobTitleId?: string
 *     hospitalId?: string
 *     phoneIds?: string[]
 *     emailIds?: string[]
 *   }>
 * }
 */
export const batchAssignContacts = async (req: Request, res: Response) => {
  try {
    const { username, rawDataId, contacts } = req.body;

    // Validation
    if (!username || !rawDataId || !Array.isArray(contacts)) {
      return res.status(400).json({
        error: 'username, rawDataId, and contacts array are required'
      });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'At least one contact required' });
    }

    // Verify raw data is locked by this user
    const rawData = await prisma.rawData.findUnique({
      where: { id: rawDataId },
      include: {
        phones: true,
        emails: true,
      }
    });

    if (!rawData) {
      return res.status(404).json({ error: 'Raw data not found' });
    }

    if (rawData.matchingInProgressBy !== username) {
      return res.status(403).json({
        error: 'You do not have a lock on this record'
      });
    }

    // Get trello title from raw data
    const trelloTitle = rawData.title;
    const notes = rawData.description || '';

    // Transaction: Create all contacts and update phones/emails
    const result = await prisma.$transaction(async (tx) => {
      const createdContacts = [];

      for (const contactData of contacts) {
        const { firstName, lastName, jobTitleId, hospitalId, phoneIds = [], emailIds = [] } = contactData;

        if (!firstName) {
          throw new Error('First name is required for all contacts');
        }

        // Collect phone numbers and email addresses
        const phoneNumbers = await tx.phone.findMany({
          where: { id: { in: phoneIds } },
          select: { id: true, phoneNumber: true, isMatched: true }
        });

        const emailAddresses = await tx.email.findMany({
          where: { id: { in: emailIds } },
          select: { id: true, emailAddress: true, isMatched: true }
        });

        // Check if already matched
        const alreadyMatchedPhone = phoneNumbers.find(p => p.isMatched);
        if (alreadyMatchedPhone) {
          throw new Error(`Phone ${alreadyMatchedPhone.phoneNumber} is already matched`);
        }

        const alreadyMatchedEmail = emailAddresses.find(e => e.isMatched);
        if (alreadyMatchedEmail) {
          throw new Error(`Email ${alreadyMatchedEmail.emailAddress} is already matched`);
        }

        // Normalize phone numbers and emails before storing
        let normalizedPhone: string | null = null;
        let normalizedEmail: string | null = null;

        if (phoneNumbers.length > 0) {
          try {
            normalizedPhone = normalizePhone(phoneNumbers[0].phoneNumber);
          } catch (error: any) {
            throw new Error(`Phone normalization failed: ${error.message}`);
          }
        }

        if (emailAddresses.length > 0) {
          try {
            normalizedEmail = normalizeEmail(emailAddresses[0].emailAddress);
          } catch (error: any) {
            throw new Error(`Email normalization failed: ${error.message}`);
          }
        }

        // Create contact with normalized phone/email
        const contact = await tx.contact.create({
          data: {
            firstName,
            lastName: lastName || null,
            phone: normalizedPhone,
            email: normalizedEmail,
            notes,
            trelloTitle,
            rawDataId,
            jobTitleId: jobTitleId || null,
            hospitalId: hospitalId || null,
          },
        });

        // Update all phones
        if (phoneIds.length > 0) {
          await tx.phone.updateMany({
            where: { id: { in: phoneIds } },
            data: {
              isMatched: true,
              matchedContactId: contact.id,
              matchedBy: username,
              matchedAt: new Date(),
            },
          });
        }

        // Update all emails
        if (emailIds.length > 0) {
          await tx.email.updateMany({
            where: { id: { in: emailIds } },
            data: {
              isMatched: true,
              matchedContactId: contact.id,
              matchedBy: username,
              matchedAt: new Date(),
            },
          });
        }

        createdContacts.push({
          ...contact,
          phoneCount: phoneIds.length,
          emailCount: emailIds.length,
        });
      }

      // Check if all phones and emails are matched
      const stillUnmatched = await tx.rawData.findUnique({
        where: { id: rawDataId },
        include: {
          phones: { where: { isMatched: false } },
          emails: { where: { isMatched: false } },
        }
      });

      // Convert to strict boolean
      const allMatched = Boolean(
        stillUnmatched &&
        stillUnmatched.phones.length === 0 &&
        stillUnmatched.emails.length === 0
      );

      // Update raw data status
      await tx.rawData.update({
        where: { id: rawDataId },
        data: {
          isFullyMatched: !!allMatched,
          matchingInProgressBy: null,
          matchingLockedAt: null,
          matchingCompletedBy: allMatched ? username : null,
          matchingCompletedAt: allMatched ? new Date() : null,
        },
      });

      return { createdContacts, allMatched };
    });

    return res.json({
      success: true,
      contacts: result.createdContacts,
      allMatched: result.allMatched,
      message: `${result.createdContacts.length} contacts created successfully`,
    });
  } catch (error: any) {
    console.error('Error in batch assign:', error);
    return res.status(500).json({
      error: error.message || 'Failed to assign contacts'
    });
  }
};

/**
 * POST /api/matching/complete
 * Mark a trello title as fully matched
 * Body: {
 *   rawDataId: string
 *   username: string
 * }
 */
export const completeMatching = async (req: Request, res: Response) => {
  try {
    const { rawDataId, username } = req.body;

    if (!rawDataId || !username) {
      return res.status(400).json({ error: 'rawDataId and username are required' });
    }

    // Verify all phones and emails for this rawData are matched
    const rawData = await prisma.rawData.findUnique({
      where: { id: rawDataId },
      include: {
        phones: { where: { isMatched: false } },
        emails: { where: { isMatched: false } },
      },
    });

    if (!rawData) {
      return res.status(404).json({ error: 'RawData not found' });
    }

    const unmatchedCount = rawData.phones.length + rawData.emails.length;

    if (unmatchedCount > 0) {
      return res.status(400).json({
        error: `Cannot complete matching. ${unmatchedCount} items still unmatched`,
        unmatchedPhones: rawData.phones.length,
        unmatchedEmails: rawData.emails.length,
      });
    }

    // Mark as fully matched
    const updated = await prisma.rawData.update({
      where: { id: rawDataId },
      data: {
        isFullyMatched: true,
        matchingInProgressBy: null,
        matchingLockedAt: null,
        matchingCompletedBy: username,
        matchingCompletedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Matching completed successfully',
      rawData: updated,
    });
  } catch (error) {
    console.error('Error completing matching:', error);
    return res.status(500).json({ error: 'Failed to complete matching' });
  }
};

/**
 * POST /api/matching/release
 * Release the lock on a trello title (when user closes page or navigates away)
 * Body: {
 *   rawDataId: string
 *   username: string
 * }
 */
export const releaseLock = async (req: Request, res: Response) => {
  try {
    const { rawDataId, username } = req.body;

    if (!rawDataId || !username) {
      return res.status(400).json({ error: 'rawDataId and username are required' });
    }

    // Verify the lock belongs to this user
    const rawData = await prisma.rawData.findUnique({
      where: { id: rawDataId },
    });

    if (!rawData) {
      return res.status(404).json({ error: 'RawData not found' });
    }

    if (rawData.matchingInProgressBy !== username) {
      return res.status(403).json({
        error: 'You do not have a lock on this record',
      });
    }

    // Release the lock
    await prisma.rawData.update({
      where: { id: rawDataId },
      data: {
        matchingInProgressBy: null,
        matchingLockedAt: null,
      },
    });

    return res.json({
      success: true,
      message: 'Lock released successfully',
    });
  } catch (error) {
    console.error('Error releasing lock:', error);
    return res.status(500).json({ error: 'Failed to release lock' });
  }
};

/**
 * GET /api/matching/job-titles
 * Get all active job titles
 */
export const getJobTitles = async (req: Request, res: Response) => {
  try {
    const jobTitles = await prisma.jobTitle.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        displayName: true,
        description: true,
      },
    });

    return res.json({ jobTitles });
  } catch (error) {
    console.error('Error getting job titles:', error);
    return res.status(500).json({ error: 'Failed to get job titles' });
  }
};

/**
 * GET /api/matching/hospitals
 * Get all hospitals with city and type info
 * Query params: search (optional)
 */
export const getHospitals = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { hastaneAdi: { contains: search, mode: 'insensitive' } },
        { il: { contains: search, mode: 'insensitive' } },
      ];
    }

    const hospitals = await prisma.hospitalReference.findMany({
      where,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        subtype: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ il: 'asc' }, { hastaneAdi: 'asc' }],
      take: 100, // Limit results for performance
    });

    return res.json({ hospitals });
  } catch (error) {
    console.error('Error getting hospitals:', error);
    return res.status(500).json({ error: 'Failed to get hospitals' });
  }
};

/**
 * GET /api/matching/stats
 * Get matching statistics
 */
export const getMatchingStats = async (req: Request, res: Response) => {
  try {
    const [
      totalRawData,
      matchedRawData,
      totalPhones,
      matchedPhones,
      totalEmails,
      matchedEmails,
      lockedRecords,
    ] = await Promise.all([
      prisma.rawData.count(),
      prisma.rawData.count({ where: { isFullyMatched: true } }),
      prisma.phone.count(),
      prisma.phone.count({ where: { isMatched: true } }),
      prisma.email.count(),
      prisma.email.count({ where: { isMatched: true } }),
      prisma.rawData.count({ where: { matchingInProgressBy: { not: null } } }),
    ]);

    return res.json({
      rawData: {
        total: totalRawData,
        matched: matchedRawData,
        unmatched: totalRawData - matchedRawData,
        locked: lockedRecords,
        percentComplete: totalRawData > 0 ? (matchedRawData / totalRawData) * 100 : 0,
      },
      phones: {
        total: totalPhones,
        matched: matchedPhones,
        unmatched: totalPhones - matchedPhones,
        percentComplete: totalPhones > 0 ? (matchedPhones / totalPhones) * 100 : 0,
      },
      emails: {
        total: totalEmails,
        matched: matchedEmails,
        unmatched: totalEmails - matchedEmails,
        percentComplete: totalEmails > 0 ? (matchedEmails / totalEmails) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error getting matching stats:', error);
    return res.status(500).json({ error: 'Failed to get matching stats' });
  }
};
