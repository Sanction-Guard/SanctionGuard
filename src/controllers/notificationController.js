import NotificationSettings from '../models/NotificationSettings.js';
import SystemLog from '../models/SystemLog.js';

// Get notification settings for current user
export const getNotificationSettings = async (req, res) => {
  try {
    // Find settings or create default if not exists
    let settings = await NotificationSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
        emailAlerts: {
          enabled: true,
          events: {
            matchesFound: true,
            systemUpdates: true,
            listUpdates: true
          }
        },
        updateFrequency: 'Weekly'
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message
    });
  }
};

// Update notification settings for current user
export const updateNotificationSettings = async (req, res) => {
  try {
    const { emailAlerts, updateFrequency } = req.body;
    
    // Find settings or create default if not exists
    let settings = await NotificationSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
        emailAlerts,
        updateFrequency
      });
    } else {
      // Update settings
      if (emailAlerts !== undefined) {
        settings.emailAlerts = emailAlerts;
      }
      
      if (updateFrequency) {
        settings.updateFrequency = updateFrequency;
      }
      
      settings.lastUpdated = Date.now();
      await settings.save();
    }
    
    // Log the action
    await SystemLog.create({
      action: 'Updated notification settings',
      category: 'Settings',
      details: { emailAlerts, updateFrequency },
      userId: req.user.id,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};