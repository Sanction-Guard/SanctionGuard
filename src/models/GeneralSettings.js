import mongoose from 'mongoose';

const generalSettingsSchema = new mongoose.Schema({
  applicationName: {
    type: String,
    default: 'Sanction Guard',
    required: true
  },
  version: {
    type: String,
    default: '1.0.0',
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('GeneralSettings', generalSettingsSchema);