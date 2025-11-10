import { Router } from 'express';
import {
  getNextUnmatched,
  assignContact,
  batchAssignContacts,
  completeMatching,
  releaseLock,
  getJobTitles,
  getHospitals,
  getMatchingStats,
} from '../controllers/matchingController';

const router = Router();

// Get the next unmatched trello title for the user to work on
router.get('/next', getNextUnmatched);

// Batch assign - must be BEFORE /assign to avoid route conflicts
router.post('/batch-assign', batchAssignContacts);

// Create a contact and assign a phone or email to it
router.post('/assign', assignContact);

// Mark a trello title as fully matched
router.post('/complete', completeMatching);

// Release the lock on a trello title
router.post('/release', releaseLock);

// Get all active job titles
router.get('/job-titles', getJobTitles);

// Get all hospitals
router.get('/hospitals', getHospitals);

// Get matching statistics
router.get('/stats', getMatchingStats);

export default router;
