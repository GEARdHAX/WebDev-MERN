/**
 * Agent Routes
 * Handles CRUD operations for agents
 */

const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
} = require('../controllers/agentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Agent CRUD routes
router.route('/')
  .get(getAgents)
  .post(createAgent);

router.route('/:id')
  .get(getAgent)
  .put(updateAgent)
  .delete(deleteAgent);

module.exports = router;
