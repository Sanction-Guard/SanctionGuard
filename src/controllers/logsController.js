import SystemLog from '../models/SystemLog.js';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get system logs with filtering and pagination
export const getSystemLogs = async (req, res) => {
  try {
    const { 
      category, 
      startDate, 
      endDate, 
      userId, 
      page = 1, 
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const logs = await SystemLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');
    
    // Get total count
    const total = await SystemLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error.message
    });
  }
};

// Export logs to CSV or PDF
export const exportLogs = async (req, res) => {
  try {
    const { 
      category, 
      startDate, 
      endDate, 
      userId, 
      format = 'csv' 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Execute query
    const logs = await SystemLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email');
    
    if (format.toLowerCase() === 'csv') {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filePath = path.join(tempDir, `system_logs_${timestamp}.csv`);
      
      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'category', title: 'Category' },
          { id: 'action', title: 'Action' },
          { id: 'user', title: 'User' },
          { id: 'ipAddress', title: 'IP Address' },
          { id: 'details', title: 'Details' }
        ]
      });
      
      // Format data for CSV
      const formattedLogs = logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        category: log.category,
        action: log.action,
        user: log.userId ? `${log.userId.name} (${log.userId.email})` : 'System',
        ipAddress: log.ipAddress || 'N/A',
        details: log.details ? JSON.stringify(log.details) : ''
      }));
      
      // Write CSV
      await csvWriter.writeRecords(formattedLogs);
      
      // Log the action
      await SystemLog.create({
        action: 'Exported system logs',
        category: 'Logs',
        details: { format: 'CSV', count: logs.length },
        userId: req.user.id,
        ipAddress: req.ip
      });
      
      // Send file
      res.download(filePath, `system_logs_${timestamp}.csv`, (err) => {
        if (err) {
          console.error('Error sending CSV file:', err);
        }
        
        // Delete file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary CSV file:', unlinkErr);
          }
        });
      });
    } else if (format.toLowerCase() === 'pdf') {
      // For PDF generation, you would typically use a library like PDFKit
      // This is a simplified example
      res.status(501).json({
        success: false,
        message: 'PDF export is not implemented yet'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Supported formats: csv, pdf'
      });
    }
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export logs',
      error: error.message
    });
  }
};