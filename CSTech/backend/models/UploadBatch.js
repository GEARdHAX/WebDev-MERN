/**
 * UploadBatch Model
 * Represents a batch of uploaded items from a CSV file
 * Used to track and group items from the same upload
 */

const mongoose = require('mongoose');

const uploadBatchSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0,
    },
    agentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    distribution: [
      {
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Agent',
        },
        itemCount: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Index for faster queries
 */
uploadBatchSchema.index({ uploadedBy: 1 });
uploadBatchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UploadBatch', uploadBatchSchema);
