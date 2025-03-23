// src/models/BlockListAuditLog.js
import { blocklistMongoose } from '../config/blocklistDB.js';

const blockListAuditLogSchema = new blocklistMongoose.Schema({
    userId: { 
        type: blocklistMongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    action: { 
        type: String, 
        required: true 
    },
    searchTerm: { 
        type: String, 
        required: true 
    },
    searchType: { 
        type: String, 
        required: true 
    },
    results: { 
        type: Array, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
}, { collection: 'systemlogs' });

const BlockListAuditLog = blocklistMongoose.model('AuditLog', blockListAuditLogSchema);

export default BlockListAuditLog;
