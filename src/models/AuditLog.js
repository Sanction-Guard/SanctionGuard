import { userMongoose } from '../config/dataB.js'; // Import the local Mongoose instance

const auditLogSchema = new userMongoose.Schema({
    userId: { type: userMongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    searchTerm: { type: String, required: true },
    searchType: { type: String, required: true },
    results: { type: Array, required: true },
    timestamp: { type: Date, default: Date.now },
}, { collection: 'systemlogs' });

const AuditLog = userMongoose.model('AuditLog', auditLogSchema);

export default AuditLog; // 👈 Use export