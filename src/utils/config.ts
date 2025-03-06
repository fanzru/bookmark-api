import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  logLevel: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://bookmarkuser:bookmarkpassword@localhost:5432/bookmarkdb',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key_for_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required configuration
const requiredEnvVars: Array<keyof Config> = ['databaseUrl', 'jwtSecret'];
const missingEnvVars = requiredEnvVars.filter(envVar => !config[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}