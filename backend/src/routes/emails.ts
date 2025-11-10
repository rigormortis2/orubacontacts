import express from 'express';
import { getEmails, getEmailStats, createEmail } from '../controllers/emailController';

const router = express.Router();

router.get('/stats', getEmailStats);
router.get('/', getEmails);
router.post('/', createEmail);

export default router;
