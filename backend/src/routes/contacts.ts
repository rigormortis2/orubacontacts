import { Router } from 'express';
import { body } from 'express-validator';
import * as contactController from '../controllers/contactController';

const router = Router();

// Validation rules
const contactValidation = [
  body('hastaneAdi').notEmpty().withMessage('Hastane adı zorunludur'),
  body('il').notEmpty().withMessage('İl zorunludur'),
  body('hastaneTuru')
    .isIn(['kamu', 'özel', 'muayenehane'])
    .withMessage('Geçerli bir hastane türü seçiniz'),
];

// Routes
router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.post('/', contactValidation, contactController.createContact);
router.put('/:id', contactValidation, contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

export default router;
