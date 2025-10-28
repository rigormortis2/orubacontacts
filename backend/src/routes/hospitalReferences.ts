import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hospital-references - Tüm referans hastaneleri getir
router.get('/', async (req, res) => {
  try {
    const references = await prisma.hospitalReference.findMany({
      include: {
        type: true,
        subtype: true
      },
      orderBy: [
        { il: 'asc' },
        { hastaneAdi: 'asc' }
      ]
    });

    res.json(references);
  } catch (error) {
    console.error('Error fetching hospital references:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/hospital-references/stats - İstatistikler
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.hospitalReference.count();

    // Type'a göre sayımlar - relation kullanarak
    const kamuCount = await prisma.hospitalReference.count({
      where: { type: { name: 'kamu' } }
    });
    const ozelCount = await prisma.hospitalReference.count({
      where: { type: { name: 'özel' } }
    });

    // Alt tür istatistikleri - relation kullanarak
    const devletCount = await prisma.hospitalReference.count({
      where: { subtype: { name: 'Devlet' } }
    });
    const egitimCount = await prisma.hospitalReference.count({
      where: { subtype: { name: 'Eğitim Araştırma' } }
    });
    const ilceCount = await prisma.hospitalReference.count({
      where: { subtype: { name: 'İlçe' } }
    });
    const universiteCount = await prisma.hospitalReference.count({
      where: { subtype: { name: 'Üniversite' } }
    });
    const sehirCount = await prisma.hospitalReference.count({
      where: { subtype: { name: 'Şehir' } }
    });

    // İllere göre dağılım
    const cityGroups = await prisma.$queryRaw<Array<{il: string, count: bigint}>>`
      SELECT il, COUNT(*) as count
      FROM hospitals
      GROUP BY il
      ORDER BY count DESC
    `;

    const cityDistribution = cityGroups.map(city => ({
      il: city.il,
      count: Number(city.count)
    }));

    res.json({
      total,
      byType: {
        kamu: kamuCount,
        özel: ozelCount
      },
      kamuSubtypes: {
        devlet: devletCount,
        egitimArastirma: egitimCount,
        ilce: ilceCount,
        universite: universiteCount,
        sehir: sehirCount
      },
      cityDistribution
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
