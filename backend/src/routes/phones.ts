import express from 'express';
import { getPhones, getPhoneStats, createPhone } from '../controllers/phoneController';

const router = express.Router();

router.get('/stats', getPhoneStats);
router.get('/', getPhones);
router.post('/', createPhone);

export default router;
