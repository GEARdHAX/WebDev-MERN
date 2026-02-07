/**
 * Agent Model
 * Represents agents who receive distributed tasks/items
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide agent name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide agent email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    mobile: {
      type: String,
      required: [true, 'Please provide mobile number'],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, 'Please provide country code'],
      trim: true,
      default: '+91',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual field to get full mobile number with country code
 */
agentSchema.virtual('fullMobile').get(function () {
  return `${this.countryCode}${this.mobile}`;
});

/**
 * Pre-save middleware to hash password before saving
 */
agentSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Index for faster queries
 */
agentSchema.index({ email: 1 });
agentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Agent', agentSchema);
