import { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import { ApiError } from '../utils/error';
import { config } from '../utils/config';
import { UserModel } from '../models/user.model';

// Types for JWT payload
interface JWTPayload {
  userId: number;
  username: string;
  exp: number;
}

// Extended Request with user info
declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
    username: string;
  }
}

// Encode secret key for JWT verification
const secretKey = new TextEncoder().encode(config.jwtSecret);

export const authenticate: MiddlewareHandler = async (c, next) => {
  try {
    // Get Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please provide a valid token.');
    }
    
    // Verify token
    const { payload } = await jwtVerify(token, secretKey);
    const { userId, username } = payload as unknown as JWTPayload;
    
    // Check if user exists
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw ApiError.unauthorized('User no longer exists.');
    }
    
    // Set user details in request context
    c.set('userId', userId);
    c.set('username', username);
    
    await next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw ApiError.unauthorized('Invalid or expired token');
  }
};