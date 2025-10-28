import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hospital-subtypes/stats - Get statistics (must be before other routes to avoid conflict)
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.hospitalSubtype.count();
    const active = await prisma.hospitalSubtype.count({ where: { isActive: true } });
    const inactive = await prisma.hospitalSubtype.count({ where: { isActive: false } });

    // Get distribution by parent type using parentTypeId
    const byParentType = await prisma.hospitalSubtype.groupBy({
      by: ['parentTypeId'],
      _count: true,
      where: { isActive: true }
    });

    // Get parent type names for distribution
    const parentTypeDistribution: Record<string, number> = {};
    for (const item of byParentType) {
      if (item.parentTypeId) {
        const parentType = await prisma.hospitalType.findUnique({
          where: { id: item.parentTypeId }
        });
        if (parentType) {
          parentTypeDistribution[parentType.name] = item._count;
        }
      }
    }

    res.json({
      total,
      active,
      inactive,
      byParentType: parentTypeDistribution
    });
  } catch (error) {
    console.error('Error fetching hospital subtype stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-subtypes/by-parent/:parentTypeSlug - Get subtypes by parent type slug
router.get('/by-parent/:parentTypeSlug', async (req, res) => {
  try {
    const { parentTypeSlug } = req.params;

    // Find parent type by slug first
    const parentType = await prisma.hospitalType.findUnique({
      where: { slug: parentTypeSlug }
    });

    if (!parentType) {
      return res.status(404).json({ error: 'Parent type not found' });
    }

    const subtypes = await prisma.hospitalSubtype.findMany({
      where: {
        parentTypeId: parentType.id,
        isActive: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    res.json(subtypes);
  } catch (error) {
    console.error('Error fetching hospital subtypes by parent type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-subtypes - Get all active hospital subtypes
router.get('/', async (req, res) => {
  try {
    const subtypes = await prisma.hospitalSubtype.findMany({
      where: {
        isActive: true
      },
      include: {
        parentType: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    res.json(subtypes);
  } catch (error) {
    console.error('Error fetching hospital subtypes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-subtypes/:slug - Get a specific hospital subtype by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const subtype = await prisma.hospitalSubtype.findUnique({
      where: {
        slug: slug
      },
      include: {
        parentType: true
      }
    });

    if (!subtype) {
      return res.status(404).json({ error: 'Hospital subtype not found' });
    }

    res.json(subtype);
  } catch (error) {
    console.error('Error fetching hospital subtype:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
