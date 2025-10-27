import { Router } from 'express';
import { body } from 'express-validator';
import * as rawDataController from '../controllers/rawDataController';

const router = Router();

// Validation rules
const rawDataValidation = [
  body('title').notEmpty().withMessage('Title zorunludur'),
  body('listName').notEmpty().withMessage('List name zorunludur'),
  body('description').optional(),
  body('shortUrl').optional().isURL().withMessage('Geçerli bir URL giriniz'),
  body('fullUrl').optional().isURL().withMessage('Geçerli bir URL giriniz'),
];

// Routes
router.get('/', rawDataController.getAllRawData);
router.get('/:id', rawDataController.getRawDataById);
router.post('/', rawDataValidation, rawDataController.createRawData);
router.put('/:id', rawDataValidation, rawDataController.updateRawData);
router.delete('/:id', rawDataController.deleteRawData);

export default router;
