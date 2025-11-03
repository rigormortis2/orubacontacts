import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cities - Get all active cities
router.get('/', async (req, res) => {
  try {
    const { region, search } = req.query;

    let whereClause: any = {
      isActive: true
    };

    // Filter by region
    if (region && typeof region === 'string') {
      whereClause.region = region;
    }

    // Search filter
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    const cities = await prisma.city.findMany({
      where: whereClause,
      orderBy: [
        { plateCode: 'asc' }  // Order by plate code (1-81)
      ]
    });

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cities/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.city.count();
    const active = await prisma.city.count({ where: { isActive: true } });
    const inactive = await prisma.city.count({ where: { isActive: false } });

    // Count by region
    const byRegion = await prisma.city.groupBy({
      by: ['region'],
      _count: true,
      where: { isActive: true }
    });

    const regionDistribution: Record<string, number> = {};
    byRegion.forEach(item => {
      if (item.region) {
        regionDistribution[item.region] = item._count;
      }
    });

    // Hospitals per city (top 10)
    const topCities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { hospitals: true }
        }
      },
      orderBy: {
        hospitals: {
          _count: 'desc'
        }
      },
      take: 10
    });

    res.json({
      total,
      active,
      inactive,
      byRegion: regionDistribution,
      topCities: topCities.map(c => ({
        id: c.id,
        name: c.name,
        plateCode: c.plateCode,
        region: c.region,
        hospitalCount: c._count.hospitals
      }))
    });
  } catch (error) {
    console.error('Error fetching city stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cities/by-region/:region - Get cities by region
router.get('/by-region/:region', async (req, res) => {
  try {
    const { region } = req.params;

    const cities = await prisma.city.findMany({
      where: {
        region,
        isActive: true
      },
      orderBy: [
        { plateCode: 'asc' }
      ]
    });

    if (cities.length === 0) {
      return res.status(404).json({ error: 'No cities found for this region' });
    }

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities by region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cities/:id - Get specific city
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: { hospitals: true }
        }
      }
    });

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({
      ...city,
      hospitalCount: city._count.hospitals
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
