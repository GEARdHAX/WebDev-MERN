/**
 * List Controller
 * Handles CSV upload, parsing, validation, and distribution
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const Agent = require('../models/Agent');
const ListItem = require('../models/ListItem');
const UploadBatch = require('../models/UploadBatch');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Parse CSV/XLSX file and return data array
 * @param {string} filePath - Path to the file
 * @returns {Array} Parsed data as array of objects
 */
const parseFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  return data;
};

/**
 * Validate CSV data format
 * @param {Array} data - Parsed CSV data
 * @returns {Object} Validation result with valid items and errors
 */
const validateData = (data) => {
  const validItems = [];
  const errors = [];

  if (!data || data.length === 0) {
    return {
      validItems: [],
      errors: ['File is empty or contains no valid data'],
    };
  }

  // Check for required columns (case-insensitive)
  const firstRow = data[0];
  const columns = Object.keys(firstRow).map((col) => col.toLowerCase());
  
  const requiredColumns = ['firstname', 'phone'];
  const missingColumns = requiredColumns.filter(
    (col) => !columns.some((c) => c === col || c.replace(/\s/g, '') === col)
  );

  if (missingColumns.length > 0) {
    return {
      validItems: [],
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
    };
  }

  // Process each row
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 for header row and 0-based index
    
    // Normalize column names (case-insensitive)
    const normalizedRow = {};
    Object.keys(row).forEach((key) => {
      normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key];
    });

    const firstName = normalizedRow.firstname;
    const phone = normalizedRow.phone;
    const notes = normalizedRow.notes || '';

    // Validate FirstName
    if (!firstName || String(firstName).trim() === '') {
      errors.push(`Row ${rowNumber}: FirstName is required`);
      return;
    }

    // Validate Phone
    if (!phone) {
      errors.push(`Row ${rowNumber}: Phone is required`);
      return;
    }

    // Phone should be numeric (allow spaces, hyphens, plus sign)
    const phoneStr = String(phone).replace(/[\s\-+]/g, '');
    if (!/^\d+$/.test(phoneStr)) {
      errors.push(`Row ${rowNumber}: Phone must be a valid number`);
      return;
    }

    validItems.push({
      firstName: String(firstName).trim(),
      phone: String(phone).trim(),
      notes: String(notes).trim(),
    });
  });

  return { validItems, errors };
};

/**
 * Distribute items equally among agents
 * @param {Array} items - Items to distribute
 * @param {Array} agents - Agents to distribute to
 * @returns {Array} Distribution result with agent assignments
 */
const distributeItems = (items, agents) => {
  const distribution = [];
  const itemsCopy = [...items];
  const agentCount = agents.length;
  const totalItems = items.length;

  // Calculate base items per agent and remaining items
  const baseItemsPerAgent = Math.floor(totalItems / agentCount);
  const remainingItems = totalItems % agentCount;

  let itemIndex = 0;

  agents.forEach((agent, agentIndex) => {
    // Calculate how many items this agent gets
    // First 'remainingItems' agents get one extra item
    const itemsForThisAgent =
      baseItemsPerAgent + (agentIndex < remainingItems ? 1 : 0);

    const agentItems = [];
    for (let i = 0; i < itemsForThisAgent; i++) {
      if (itemIndex < itemsCopy.length) {
        agentItems.push({
          ...itemsCopy[itemIndex],
          assignedTo: agent._id,
        });
        itemIndex++;
      }
    }

    distribution.push({
      agent: agent,
      items: agentItems,
      itemCount: agentItems.length,
    });
  });

  return distribution;
};

/**
 * @desc    Upload CSV and distribute to agents
 * @route   POST /api/lists/upload
 * @access  Private
 */
const uploadAndDistribute = asyncHandler(async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file',
    });
  }

  const filePath = req.file.path;

  try {
    // Get all active agents for the current user
    const agents = await Agent.find({
      createdBy: req.user.id,
      isActive: true,
    }).select('-password');

    if (agents.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'No active agents found. Please add at least one agent before uploading.',
      });
    }

    // Parse the uploaded file
    const parsedData = parseFile(filePath);

    // Validate the data
    const { validItems, errors } = validateData(parsedData);

    if (validItems.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'No valid items found in the file',
        errors: errors,
      });
    }

    // Distribute items among agents
    const distribution = distributeItems(validItems, agents);

    // Create upload batch record
    const uploadBatch = await UploadBatch.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      totalItems: validItems.length,
      agentCount: agents.length,
      uploadedBy: req.user.id,
      distribution: distribution.map((d) => ({
        agent: d.agent._id,
        itemCount: d.itemCount,
      })),
    });

    // Save all list items to database
    const listItemsToInsert = [];
    distribution.forEach((d) => {
      d.items.forEach((item) => {
        listItemsToInsert.push({
          ...item,
          uploadBatch: uploadBatch._id,
          uploadedBy: req.user.id,
        });
      });
    });

    await ListItem.insertMany(listItemsToInsert);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Prepare response with distribution summary
    const distributionSummary = distribution.map((d) => ({
      agent: {
        id: d.agent._id,
        name: d.agent.name,
        email: d.agent.email,
      },
      itemCount: d.itemCount,
      items: d.items.map((item) => ({
        firstName: item.firstName,
        phone: item.phone,
        notes: item.notes,
      })),
    }));

    res.status(201).json({
      success: true,
      message: `Successfully distributed ${validItems.length} items among ${agents.length} agents`,
      data: {
        batchId: uploadBatch._id,
        fileName: req.file.originalname,
        totalItems: validItems.length,
        agentCount: agents.length,
        distribution: distributionSummary,
      },
      ...(errors.length > 0 && {
        warnings: errors,
        warningCount: errors.length,
      }),
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
});

/**
 * @desc    Get all upload batches with distribution
 * @route   GET /api/lists
 * @access  Private
 */
const getAllLists = asyncHandler(async (req, res) => {
  const batches = await UploadBatch.find({ uploadedBy: req.user.id })
    .populate('distribution.agent', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: batches.length,
    data: batches,
  });
});

/**
 * @desc    Get list items by agent
 * @route   GET /api/lists/agent/:agentId
 * @access  Private
 */
const getListsByAgent = asyncHandler(async (req, res) => {
  // Verify agent belongs to user
  const agent = await Agent.findOne({
    _id: req.params.agentId,
    createdBy: req.user.id,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  const items = await ListItem.find({
    assignedTo: req.params.agentId,
    uploadedBy: req.user.id,
  })
    .populate('uploadBatch', 'originalName createdAt')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
    },
    count: items.length,
    data: items,
  });
});

/**
 * @desc    Get distribution details for a specific batch
 * @route   GET /api/lists/batch/:batchId
 * @access  Private
 */
const getBatchDetails = asyncHandler(async (req, res) => {
  const batch = await UploadBatch.findOne({
    _id: req.params.batchId,
    uploadedBy: req.user.id,
  }).populate('distribution.agent', 'name email');

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found',
    });
  }

  // Get all items for this batch, grouped by agent
  const items = await ListItem.find({
    uploadBatch: batch._id,
  }).populate('assignedTo', 'name email');

  // Group items by agent
  const itemsByAgent = {};
  items.forEach((item) => {
    const agentId = item.assignedTo._id.toString();
    if (!itemsByAgent[agentId]) {
      itemsByAgent[agentId] = {
        agent: {
          id: item.assignedTo._id,
          name: item.assignedTo.name,
          email: item.assignedTo.email,
        },
        items: [],
      };
    }
    itemsByAgent[agentId].items.push({
      id: item._id,
      firstName: item.firstName,
      phone: item.phone,
      notes: item.notes,
    });
  });

  res.status(200).json({
    success: true,
    data: {
      batch: {
        id: batch._id,
        fileName: batch.originalName,
        totalItems: batch.totalItems,
        agentCount: batch.agentCount,
        createdAt: batch.createdAt,
      },
      distribution: Object.values(itemsByAgent),
    },
  });
});

/**
 * @desc    Delete a batch and its items
 * @route   DELETE /api/lists/:id
 * @access  Private
 */
const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await UploadBatch.findOne({
    _id: req.params.id,
    uploadedBy: req.user.id,
  });

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found',
    });
  }

  // Delete all items in this batch
  await ListItem.deleteMany({ uploadBatch: batch._id });

  // Delete the batch
  await UploadBatch.deleteOne({ _id: batch._id });

  res.status(200).json({
    success: true,
    message: 'Batch and all associated items deleted successfully',
  });
});

module.exports = {
  uploadAndDistribute,
  getAllLists,
  getListsByAgent,
  getBatchDetails,
  deleteBatch,
};
