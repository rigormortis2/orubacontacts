import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hospital-references - Tüm referans hastaneleri getir
router.get('/', async (req, res) => {
  try {
    const { unused, search } = req.query;

    let whereClause: any = {};

    // Sadece hiç kullanılmamış hastaneleri getir
    if (unused === 'true') {
      whereClause.contacts = {
        none: {}
      };
    }

    // Arama filtresi
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { hastaneAdi: { contains: search, mode: 'insensitive' } },
        { il: { contains: search, mode: 'insensitive' } },
        { city: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const references = await prisma.hospitalReference.findMany({
      where: whereClause,
      include: {
        city: true,
        type: true,
        subtype: true
      },
      orderBy: [
        { city: { plateCode: 'asc' } },
        { hastaneAdi: 'asc' }
      ]
    });

    res.json(references);
  } catch (error) {
    console.error('Error fetching hospital references:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/hospital-references - Create new hospital reference
router.post('/', async (req, res) => {
  try {
    const { hastaneAdi, cityId, il, typeId, subtypeId } = req.body;

    // Determine city information
    let useCityId = cityId || null;
    let useIl = il || '';

    // If cityId is provided, fetch city name to populate il field
    if (useCityId) {
      const city = await prisma.city.findUnique({
        where: { id: useCityId }
      });

      if (!city) {
        return res.status(404).json({ error: 'Geçersiz şehir' });
      }

      // Auto-populate il field from city name for data consistency
      useIl = city.name;
    }

    // Validation
    if (!hastaneAdi || !typeId || !subtypeId) {
      return res.status(400).json({
        error: 'Tüm alanlar zorunludur (hastaneAdi, cityId veya il, typeId, subtypeId)'
      });
    }

    // If neither cityId nor il is provided, return error
    if (!useCityId && !useIl) {
      return res.status(400).json({
        error: 'Şehir bilgisi gereklidir (cityId veya il)'
      });
    }

    // Check if hospital already exists
    const existingConditions: any = {
      hastaneAdi: hastaneAdi.trim()
    };

    if (useCityId) {
      existingConditions.cityId = useCityId;
    } else if (useIl) {
      existingConditions.il = useIl.trim();
    }

    const existing = await prisma.hospitalReference.findFirst({
      where: existingConditions
    });

    if (existing) {
      return res.status(409).json({
        error: 'Bu hastane zaten kayıtlı'
      });
    }

    // Verify type and subtype exist
    const [type, subtype] = await Promise.all([
      prisma.hospitalType.findUnique({ where: { id: typeId } }),
      prisma.hospitalSubtype.findUnique({ where: { id: subtypeId } })
    ]);

    if (!type) {
      return res.status(404).json({ error: 'Geçersiz hastane türü' });
    }
    if (!subtype) {
      return res.status(404).json({ error: 'Geçersiz alt tür' });
    }

    // Create hospital
    const hospital = await prisma.hospitalReference.create({
      data: {
        hastaneAdi: hastaneAdi.trim(),
        il: useIl.trim(),
        cityId: useCityId,
        typeId,
        subtypeId,
        kaynak: 'Manuel Ekleme'
      },
      include: {
        city: true,
        type: true,
        subtype: true
      }
    });

    res.status(201).json(hospital);
  } catch (error: any) {
    console.error('Error creating hospital reference:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu hastane zaten kayıtlı' });
    }
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

    // City distribution using new city relation
    const cityGroups = await prisma.hospitalReference.groupBy({
      by: ['cityId'],
      _count: true,
      where: {
        cityId: { not: null }
      }
    });

    // Get city names for the grouped data
    const cityIds = cityGroups.map(g => g.cityId).filter(Boolean) as string[];
    const cities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true, plateCode: true }
    });

    const cityMap = new Map(cities.map(c => [c.id, c]));

    const cityDistribution = cityGroups
      .map(group => {
        const city = group.cityId ? cityMap.get(group.cityId) : null;
        return {
          cityId: group.cityId,
          cityName: city?.name || 'Unknown',
          plateCode: city?.plateCode,
          count: group._count
        };
      })
      .sort((a, b) => b.count - a.count);

    // Legacy il field distribution for backward compatibility
    const legacyIlGroups = await prisma.$queryRaw<Array<{il: string, count: bigint}>>`
      SELECT il, COUNT(*) as count
      FROM hospitals
      WHERE il IS NOT NULL AND il != ''
      GROUP BY il
      ORDER BY count DESC
    `;

    const legacyIlDistribution = legacyIlGroups.map(city => ({
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
      cityDistribution,
      legacyIlDistribution // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
