import GeneralSettings from '../models/GeneralSettings.js';
import SystemLog from '../models/SystemLog.js';

// Get general settings
export const getGeneralSettings = async (req, res) => {
  try {
    // Find settings or create default if not exists
    let settings = await GeneralSettings.findOne();
    
    if (!settings) {
      settings = await GeneralSettings.create({
        applicationName: 'Sanction Guard',
        version: '1.0.0',
        timezone: 'UTC'
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch general settings',
      error: error.message
    });
  }
};

// Update general settings
export const updateGeneralSettings = async (req, res) => {
  try {
    const { applicationName, timezone } = req.body;
    
    // Validate input
    if (!applicationName || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Application name and timezone are required'
      });
    }
    
    // Find settings or create default if not exists
    let settings = await GeneralSettings.findOne();
    
    if (!settings) {
      settings = await GeneralSettings.create({
        applicationName,
        timezone,
        updatedBy: req.user.id
      });
    } else {
      settings.applicationName = applicationName;
      settings.timezone = timezone;
      settings.updatedBy = req.user.id;
      settings.lastUpdated = Date.now();
      await settings.save();
    }
    
    // Log the action
    await SystemLog.create({
      action: 'Updated general settings',
      category: 'Settings',
      details: { applicationName, timezone },
      userId: req.user.id,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'General settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general settings',
      error: error.message
    });
  }
};