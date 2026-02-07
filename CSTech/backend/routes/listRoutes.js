/**
 * List Routes
 * Handles CSV upload and distribution routes
 */

const express = require('express');
const router = express.Router();
const {
  uploadAndDistribute,
  getAllLists,
  getListsByAgent,
  getBatchDetails,
  deleteBatch,
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Upload and distribute CSV
router.post(
  '/upload',
  upload.single('file'),
  handleUploadError,
  uploadAndDistribute
);

// Get all upload batches
router.get('/', getAllLists);

// Get items by agent
router.get('/agent/:agentId', getListsByAgent);

// Get batch details
router.get('/batch/:batchId', getBatchDetails);

// Delete batch
router.delete('/:id', deleteBatch);

module.exports = router;
