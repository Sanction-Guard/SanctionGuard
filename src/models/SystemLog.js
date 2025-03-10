import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Login', 'Settings', 'Database', 'Screening', 'User', 'System'],
    required: true
  },
  details: {
    type: Object
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
systemLogSchema.index({ category: 1, timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('SystemLog', systemLogSchema);