export const APP_CONFIG = {
    PORT: process.env.PORT || 5000,
    CORS_OPTIONS: {
      origin: '*',  // Configure as needed
      methods: ['GET', 'POST']
    }
  };