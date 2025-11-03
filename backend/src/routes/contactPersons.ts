import { Router } from 'express';
import { body } from 'express-validator';
import * as contactPersonController from '../controllers/contactPersonController';

const router = Router();

// Validation rules
const contactValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),

  body('jobTitleId')
    .optional()
    .isUUID()
    .withMessage('Job title ID must be a valid UUID'),

  body('hospitalId')
    .optional()
    .isUUID()
    .withMessage('Hospital ID must be a valid UUID')
];

const contactUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number must not exceed 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),

  body('jobTitleId')
    .optional()
    .isUUID()
    .withMessage('Job title ID must be a valid UUID'),

  body('hospitalId')
    .optional()
    .isUUID()
    .withMessage('Hospital ID must be a valid UUID')
];

// Routes
// IMPORTANT: Stats endpoint must be before /:id to avoid route conflicts
router.get('/stats', contactPersonController.getContactStats);
router.get('/', contactPersonController.getAllContacts);
router.get('/:id', contactPersonController.getContactById);
router.post('/', contactValidation, contactPersonController.createContact);
router.put('/:id', contactUpdateValidation, contactPersonController.updateContact);
router.delete('/:id', contactPersonController.deleteContact);

export default router;
