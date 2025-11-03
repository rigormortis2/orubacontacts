import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/person-contacts/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.personContact.count();
    const active = await prisma.personContact.count({ where: { isActive: true } });
    const inactive = await prisma.personContact.count({ where: { isActive: false } });
    const withEmail = await prisma.personContact.count({
      where: {
        email: { not: null },
        isActive: true
      }
    });
    const withPhone = await prisma.personContact.count({
      where: {
        phone: { not: null },
        isActive: true
      }
    });
    const withHospital = await prisma.personContact.count({
      where: {
        hospitalId: { not: null },
        isActive: true
      }
    });
    const withJobTitle = await prisma.personContact.count({
      where: {
        jobTitleId: { not: null },
        isActive: true
      }
    });

    res.json({
      total,
      active,
      inactive,
      withEmail,
      withPhone,
      withHospital,
      withJobTitle
    });
  } catch (error) {
    console.error('Error fetching person contact stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/person-contacts - Get all active person contacts with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const hospitalId = req.query.hospitalId as string;
    const jobTitleId = req.query.jobTitleId as string;
    const isActive = req.query.isActive !== 'false'; // Default true
    const search = req.query.search as string;

    // Build where clause
    const where: any = { isActive };

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
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [personContacts, total] = await Promise.all([
      prisma.personContact.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          jobTitle: true,
          hospital: {
            select: {
              id: true,
              hastaneAdi: true,
              il: true
            }
          }
        }
      }),
      prisma.personContact.count({ where })
    ]);

    res.json({
      data: personContacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching person contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/person-contacts/:id - Get a specific person contact by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const personContact = await prisma.personContact.findUnique({
      where: { id },
      include: {
        jobTitle: true,
        hospital: {
          select: {
            id: true,
            hastaneAdi: true,
            il: true,
            type: true,
            subtype: true
          }
        }
      }
    });

    if (!personContact) {
      return res.status(404).json({ error: 'Person contact not found' });
    }

    res.json(personContact);
  } catch (error) {
    console.error('Error fetching person contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/person-contacts - Create a new person contact
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, fullName, phone, email, jobTitleId, hospitalId, isActive } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    // Auto-generate fullName if not provided
    const generatedFullName = fullName || `${firstName} ${lastName}`;

    const personContact = await prisma.personContact.create({
      data: {
        firstName,
        lastName,
        fullName: generatedFullName,
        phone,
        email,
        jobTitleId,
        hospitalId,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        jobTitle: true,
        hospital: {
          select: {
            id: true,
            hastaneAdi: true,
            il: true
          }
        }
      }
    });

    res.status(201).json(personContact);
  } catch (error) {
    console.error('Error creating person contact:', error);

    // Handle unique constraint violations or other Prisma errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'A person contact with this information already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/person-contacts/:id - Update a person contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, fullName, phone, email, jobTitleId, hospitalId, isActive } = req.body;

    // Check if person contact exists
    const existingContact = await prisma.personContact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Person contact not found' });
    }

    // Build update data object
    const updateData: any = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (jobTitleId !== undefined) updateData.jobTitleId = jobTitleId;
    if (hospitalId !== undefined) updateData.hospitalId = hospitalId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Auto-update fullName if firstName or lastName changed
    if (firstName || lastName) {
      const newFirstName = firstName || existingContact.firstName;
      const newLastName = lastName || existingContact.lastName;
      updateData.fullName = fullName || `${newFirstName} ${newLastName}`;
    } else if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    const updatedContact = await prisma.personContact.update({
      where: { id },
      data: updateData,
      include: {
        jobTitle: true,
        hospital: {
          select: {
            id: true,
            hastaneAdi: true,
            il: true
          }
        }
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating person contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/person-contacts/:id - Delete (soft delete) a person contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';

    // Check if person contact exists
    const existingContact = await prisma.personContact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Person contact not found' });
    }

    if (hardDelete) {
      // Hard delete - permanently remove from database
      await prisma.personContact.delete({
        where: { id }
      });
      res.json({ message: 'Person contact permanently deleted', id });
    } else {
      // Soft delete - set isActive to false
      const updatedContact = await prisma.personContact.update({
        where: { id },
        data: { isActive: false }
      });
      res.json({ message: 'Person contact deactivated', contact: updatedContact });
    }
  } catch (error) {
    console.error('Error deleting person contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/person-contacts/:id/restore - Restore a soft-deleted person contact
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if person contact exists
    const existingContact = await prisma.personContact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Person contact not found' });
    }

    if (existingContact.isActive) {
      return res.status(400).json({ error: 'Person contact is already active' });
    }

    const restoredContact = await prisma.personContact.update({
      where: { id },
      data: { isActive: true },
      include: {
        jobTitle: true,
        hospital: {
          select: {
            id: true,
            hastaneAdi: true,
            il: true
          }
        }
      }
    });

    res.json({ message: 'Person contact restored', contact: restoredContact });
  } catch (error) {
    console.error('Error restoring person contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
