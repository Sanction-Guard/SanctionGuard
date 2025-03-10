import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailAlerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    events: {
      matchesFound: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: true
      },
      listUpdates: {
        type: Boolean,
        default: true
      }
    }
  },
  updateFrequency: {
    type: String,
    enum: ['Manual', 'Daily', 'Weekly', 'Monthly'],
    default: 'Weekly'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('NotificationSettings', notificationSettingsSchema);