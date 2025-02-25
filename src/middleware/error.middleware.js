import { formatResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json(formatResponse.error(message, statusCode, err));
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json(formatResponse.error('Route not found', 404));
};