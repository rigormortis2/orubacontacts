import { Router } from 'express';
import { body } from 'express-validator';
import * as contactController from '../controllers/contactController';

const router = Router();

// Validation rules
const contactValidation = [
  body('trelloBaslik').notEmpty().withMessage('Trello başlık zorunludur'),
  body('hospitalId').optional().isUUID().withMessage('Geçerli bir hospital ID giriniz'),
];

// Routes
router.get('/stats', contactController.getContactStats); // Stats endpoint must be before /:id
router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.post('/', contactValidation, contactController.createContact);
router.put('/:id', contactValidation, contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

export default router;
