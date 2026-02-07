/**
 * Agent Controller
 * Handles CRUD operations for agents
 */

const Agent = require('../models/Agent');
const ListItem = require('../models/ListItem');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all agents
 * @route   GET /api/agents
 * @access  Private
 */
const getAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find({ createdBy: req.user.id })
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: agents.length,
    data: agents,
  });
});

/**
 * @desc    Get single agent
 * @route   GET /api/agents/:id
 * @access  Private
 */
const getAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  }).select('-password');

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  res.status(200).json({
    success: true,
    data: agent,
  });
});

/**
 * @desc    Create new agent
 * @route   POST /api/agents
 * @access  Private
 */
const createAgent = asyncHandler(async (req, res) => {
  const { name, email, mobile, countryCode, password } = req.body;

  // Validate required fields
  if (!name || !email || !mobile || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, mobile, password',
    });
  }

  // Validate mobile number (should contain only digits)
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number must be exactly 10 digits',
    });
  }

  // Validate country code format
  const countryCodeRegex = /^\+\d{1,4}$/;
  if (countryCode && !countryCodeRegex.test(countryCode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid country code format. Example: +91, +1, +44',
    });
  }

  // Check if agent with email already exists
  const existingAgent = await Agent.findOne({ email });
  if (existingAgent) {
    return res.status(400).json({
      success: false,
      message: 'An agent with this email already exists',
    });
  }

  // Create agent
  const agent = await Agent.create({
    name,
    email,
    mobile,
    countryCode: countryCode || '+91',
    password,
    createdBy: req.user.id,
  });

  // Remove password from response
  const agentResponse = agent.toObject();
  delete agentResponse.password;

  res.status(201).json({
    success: true,
    message: 'Agent created successfully',
    data: agentResponse,
  });
});

/**
 * @desc    Update agent
 * @route   PUT /api/agents/:id
 * @access  Private
 */
const updateAgent = asyncHandler(async (req, res) => {
  const { name, email, mobile, countryCode, password, isActive } = req.body;

  let agent = await Agent.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== agent.email) {
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'An agent with this email already exists',
      });
    }
  }

  // Validate mobile if provided
  if (mobile) {
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }
  }

  // Validate country code if provided
  if (countryCode) {
    const countryCodeRegex = /^\+\d{1,4}$/;
    if (!countryCodeRegex.test(countryCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid country code format. Example: +91, +1, +44',
      });
    }
  }

  // Update fields
  if (name) agent.name = name;
  if (email) agent.email = email;
  if (mobile) agent.mobile = mobile;
  if (countryCode) agent.countryCode = countryCode;
  if (password) agent.password = password;
  if (typeof isActive === 'boolean') agent.isActive = isActive;

  await agent.save();

  // Remove password from response
  const agentResponse = agent.toObject();
  delete agentResponse.password;

  res.status(200).json({
    success: true,
    message: 'Agent updated successfully',
    data: agentResponse,
  });
});

/**
 * @desc    Delete agent
 * @route   DELETE /api/agents/:id
 * @access  Private
 */
const deleteAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  // Check if agent has assigned items
  const assignedItems = await ListItem.countDocuments({ assignedTo: agent._id });
  
  if (assignedItems > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete agent. ${assignedItems} items are assigned to this agent. Please delete or reassign them first.`,
    });
  }

  await Agent.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Agent deleted successfully',
  });
});

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
};
