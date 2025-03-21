import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    searchTerm: { type: String, required: true },
    searchType: { type: String, required: true },
    results: { type: Array, required: true },
    timestamp: { type: Date, default: Date.now },
}, { collection: 'systemlogs' });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog; // 👈 Use export