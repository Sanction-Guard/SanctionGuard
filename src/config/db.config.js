export const DB_CONFIG = {
    USERNAME: process.env.DB_USERNAME || 'SanctionGuard',
    PASSWORD: process.env.DB_PASSWORD || 'SanctionGuard',
    CLUSTER: process.env.DB_CLUSTER || 'sanctioncluster.2myce.mongodb.net',
    URI: process.env.MONGODB_URI || `mongodb+srv://${process.env.DB_USERNAME || 'SanctionGuard'}:${process.env.DB_PASSWORD || 'SanctionGuard'}@${process.env.DB_CLUSTER || 'sanctioncluster.2myce.mongodb.net'}/test?retryWrites=true&w=majority`
  };