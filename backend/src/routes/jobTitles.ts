import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/job-titles/stats - Get statistics (must be before /:slug to avoid route conflict)
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.jobTitle.count();
    const active = await prisma.jobTitle.count({ where: { isActive: true } });
    const inactive = await prisma.jobTitle.count({ where: { isActive: false } });

    res.json({
      total,
      active,
      inactive
    });
  } catch (error) {
    console.error('Error fetching job title stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/job-titles - Get all active job titles
router.get('/', async (req, res) => {
  try {
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    res.json(jobTitles);
  } catch (error) {
    console.error('Error fetching job titles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/job-titles/:slug - Get a specific job title by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const jobTitle = await prisma.jobTitle.findUnique({
      where: {
        slug: slug
      }
    });

    if (!jobTitle) {
      return res.status(404).json({ error: 'Job title not found' });
    }

    res.json(jobTitle);
  } catch (error) {
    console.error('Error fetching job title:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
