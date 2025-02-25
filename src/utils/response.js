export const formatResponse = {
    success: (data, message = 'Success') => {
      return {
        success: true,
        message,
        data
      };
    },
    
    error: (message = 'An error occurred', statusCode = 500, error = null) => {
      return {
        success: false,
        message,
        statusCode,
        error: error?.message || error
      };
    }
  };