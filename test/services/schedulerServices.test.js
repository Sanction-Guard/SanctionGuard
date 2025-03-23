// import { jest } from '@jest/globals';
// import { startScheduler, runScheduledTask } from '../../src/services/schedulerServices.js';
// import { fetchAndParseXML, processIndividuals, processEntities } from '../../src/services/xmlServices.js';
// import { connectDB } from '../../src/config/database.js';

// // Mock dependencies
// jest.mock('../../src/services/xmlServices.js');
// jest.mock('../../src/config/database.js');

// // Mock node-cron
// jest.mock('node-cron', () => ({
//   schedule: jest.fn((cronExpression, callback) => {
//     // Store the callback for testing
//     global.__cronCallback = callback;
//     return {
//       start: jest.fn()
//     };
//   })
// }));

// describe('Scheduler Services', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     // Mock console.log to avoid cluttering test output
//     jest.spyOn(console, 'log').mockImplementation(() => {});
//   });

//   describe('startScheduler', () => {
//     test('should initialize cron job with correct schedule', () => {
//       // Act
//       startScheduler();

//       // Assert
//       expect(require('node-cron').schedule).toHaveBeenCalledWith(
//         '0 */15 * * *',
//         expect.any(Function)
//       );
//     });

//     test('should run initial task on startup', () => {
//       // Setup
//       const mockRunTask = jest.spyOn(global, 'runScheduledTask');

//       // Act
//       startScheduler();

//       // Assert
//       expect(mockRunTask).toHaveBeenCalled();
//     });
//   });

//   describe('runScheduledTask', () => {
//     test('should execute all steps in correct order', async () => {
//       // Setup
//       const mockXMLData = { individuals: [], entities: [] };
//       fetchAndParseXML.mockResolvedValueOnce(mockXMLData);

//       // Act
//       await runScheduledTask();

//       // Assert
//       expect(connectDB).toHaveBeenCalled();
//       expect(fetchAndParseXML).toHaveBeenCalled();
//       expect(processIndividuals).toHaveBeenCalledWith(mockXMLData);
//       expect(processEntities).toHaveBeenCalledWith(mockXMLData);
//     });

//     test('should handle errors gracefully', async () => {
//       // Setup
//       const error = new Error('Database connection failed');
//       connectDB.mockRejectedValueOnce(error);

//       // Act
//       await runScheduledTask();

//       // Assert
//       expect(console.log).toHaveBeenCalledWith(
//         expect.stringContaining('Scheduled task error: Database connection failed')
//       );
//     });
//   });
// });

// test/services/schedulerServices.test.js
import { jest } from '@jest/globals';
import cron from 'node-cron';
import { startScheduler } from '../../src/services/schedulerServices.js';
import { runScheduledTask } from '../../src/controllers/sanctionController.js';
import { logger } from '../../src/utils/logger.js';
import { CRON_SCHEDULE } from '../../src/config/constants.js';

// Mock dependencies
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

jest.mock('../../src/controllers/sanctionController.js', () => ({
  runScheduledTask: jest.fn().mockResolvedValue()
}));

jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn()
  }
}));

describe('Scheduler Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('startScheduler should set up cron job with correct schedule', () => {
    // Act
    startScheduler();
    
    // Assert
    expect(cron.schedule).toHaveBeenCalledWith(CRON_SCHEDULE, expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith('Starting scheduler...');
  });

  test('startScheduler should run task immediately on startup', () => {
    // Act
    startScheduler();
    
    // Assert
    expect(runScheduledTask).toHaveBeenCalled();
  });

  test('cron job should run the scheduled task when triggered', async () => {
    // Setup - capture the scheduled function
    startScheduler();
    const cronCallback = cron.schedule.mock.calls[0][1];
    
    // Act - execute the captured function
    await cronCallback();
    
    // Assert
    expect(logger.info).toHaveBeenCalledWith('Running scheduled task...');
    expect(runScheduledTask).toHaveBeenCalledTimes(2); // Once on startup, once when triggered
  });
});