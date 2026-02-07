/**
 * ListItem Model
 * Represents individual items from uploaded CSV that are distributed to agents
 */

const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'FirstName is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent assignment is required'],
    },
    uploadBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadBatch',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for faster queries
 */
listItemSchema.index({ assignedTo: 1 });
listItemSchema.index({ uploadBatch: 1 });
listItemSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('ListItem', listItemSchema);
