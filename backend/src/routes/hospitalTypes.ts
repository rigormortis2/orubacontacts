import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hospital-types - Tüm aktif hastane türlerini getir
router.get('/', async (req, res) => {
  try {
    const hospitalTypes = await prisma.hospitalType.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });

    res.json(hospitalTypes);
  } catch (error) {
    console.error('Error fetching hospital types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-types/stats - İstatistikler
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.hospitalType.count();
    const active = await prisma.hospitalType.count({ where: { isActive: true } });
    const inactive = await prisma.hospitalType.count({ where: { isActive: false } });

    // Her bir hastane türü için contact kayıt sayılarını hesapla (hospital relation üzerinden)
    const kamuCount = await prisma.trelloMatches.count({
      where: {
        hospital: {
          type: {
            name: 'kamu'
          }
        }
      }
    });

    const ozelCount = await prisma.trelloMatches.count({
      where: {
        hospital: {
          type: {
            name: 'özel'
          }
        }
      }
    });

    const muayenehaneCount = await prisma.trelloMatches.count({
      where: {
        hospital: {
          type: {
            name: 'muayenehane'
          }
        }
      }
    });

    // Hospital references tablosundan da sayıları al - artık type relation kullanıyoruz
    const kamuRefCount = await prisma.hospitalReference.count({
      where: { type: { name: 'kamu' } }
    });
    const ozelRefCount = await prisma.hospitalReference.count({
      where: { type: { name: 'özel' } }
    });

    res.json({
      total,
      active,
      inactive,
      contactsDistribution: {
        kamu: kamuCount,
        özel: ozelCount,
        muayenehane: muayenehaneCount
      },
      referencesDistribution: {
        kamu: kamuRefCount,
        özel: ozelRefCount
      }
    });
  } catch (error) {
    console.error('Error fetching hospital types stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-types/:slug - Belirli bir hastane türünü getir
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const hospitalType = await prisma.hospitalType.findUnique({
      where: {
        slug
      }
    });

    if (!hospitalType) {
      return res.status(404).json({ error: 'Hospital type not found' });
    }

    res.json(hospitalType);
  } catch (error) {
    console.error('Error fetching hospital type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
