import { Context } from 'hono';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { UserModel, UserCreate } from '../models/user.model';
import { ApiError } from '../utils/error';
import { config } from '../utils/config';
import { sendSuccess, sendError } from '../utils/response';

// Define validation schema for registration
export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

// Define validation schema for login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Define validation schema for token refresh
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

// Encode secret key for JWT
const secretKey = new TextEncoder().encode(config.jwtSecret);
const refreshSecretKey = new TextEncoder().encode(config.jwtSecret + '-refresh');

// Controller for auth routes
export class AuthController {
  // Register a new user
  static async register(c: Context): Promise<Response> {
    try {
      const data = c.get('validatedData') as UserCreate;
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      
      // Create user with hashed password
      const user = await UserModel.create({
        ...data,
        password: hashedPassword
      });
      
      // Generate JWT token
      const token = await AuthController.generateToken(user.id, user.username);
      
      // Generate refresh token
      const refreshToken = await AuthController.generateRefreshToken(user.id, user.username);
      
      return sendSuccess(
        c,
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token,
          refreshToken
        },
        'User registered successfully',
        'USER_REGISTERED',
        201
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to register user');
    }
  }
  
  // Login user
  static async login(c: Context): Promise<Response> {
    try {
      const { email, password } = c.get('validatedData') as { email: string, password: string };
      
      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        return sendError(c, 'Invalid email or password', undefined, 401, 'INVALID_CREDENTIALS');
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return sendError(c, 'Invalid email or password', undefined, 401, 'INVALID_CREDENTIALS');
      }
      
      // Generate JWT token
      const token = await AuthController.generateToken(user.id, user.username);
      
      // Generate refresh token
      const refreshToken = await AuthController.generateRefreshToken(user.id, user.username);
      
      return sendSuccess(
        c,
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token,
          refreshToken
        },
        'Login successful',
        'LOGIN_SUCCESS'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to login');
    }
  }
  
  // Refresh token
  static async refreshToken(c: Context): Promise<Response> {
    try {
      const { refreshToken } = c.get('validatedData') as { refreshToken: string };
      
      // Verify refresh token
      try {
        const { payload } = await jwtVerify(refreshToken, refreshSecretKey);
        const { userId, username } = payload as { userId: number, username: string };
        
        // Check if user exists
        const user = await UserModel.findById(userId);
        
        if (!user) {
          return sendError(c, 'User no longer exists', undefined, 401, 'USER_NOT_FOUND');
        }
        
        // Generate new access token
        const newToken = await AuthController.generateToken(userId, username);
        
        return sendSuccess(
          c,
          {
            token: newToken
          },
          'Token refreshed successfully',
          'TOKEN_REFRESHED'
        );
      } catch (error) {
        return sendError(c, 'Invalid or expired refresh token', undefined, 401, 'INVALID_REFRESH_TOKEN');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to refresh token');
    }
  }
  
  // Helper method to generate JWT token
  static async generateToken(userId: number, username: string): Promise<string> {
    const expiresIn = config.jwtExpiresIn || '24h';
    const expirationTime = expiresIn.endsWith('h') 
      ? parseInt(expiresIn.slice(0, -1)) * 60 * 60
      : expiresIn.endsWith('m')
        ? parseInt(expiresIn.slice(0, -1)) * 60
        : parseInt(expiresIn.slice(0, -1));
    
    const token = await new SignJWT({ userId, username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
      .sign(secretKey);
    
    return token;
  }
  
  // Helper method to generate refresh token
  static async generateRefreshToken(userId: number, username: string): Promise<string> {
    const expiresIn = config.refreshTokenExpiresIn || '7d';
    const expirationTime = expiresIn.endsWith('d') 
      ? parseInt(expiresIn.slice(0, -1)) * 24 * 60 * 60
      : expiresIn.endsWith('h')
        ? parseInt(expiresIn.slice(0, -1)) * 60 * 60
        : parseInt(expiresIn.slice(0, -1));
    
    const token = await new SignJWT({ userId, username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
      .sign(refreshSecretKey);
    
    return token;
  }
}