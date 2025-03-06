import { Pool } from 'pg';
import { config } from './config';
import logger from './logger';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

// Test the database connection
pool.connect()
  .then(client => {
    logger.info('Successfully connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    logger.error('Failed to connect to PostgreSQL database', err);
    process.exit(1);
  });

export default {
  query: (text: string, params: any[] = []) => {
    logger.debug('Executing query', { text, params });
    return pool.query(text, params);
  },
  getClient: () => pool.connect(),
};