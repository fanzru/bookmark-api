import { Context } from 'hono';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { UserModel, UserCreate } from '../models/user.model';
import { ApiError } from '../utils/error';
import { config } from '../utils/config';

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
      
      return c.json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token,
        refreshToken
      }, 201);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to register user');
    }
  }
  
  // Login user
  static async login(c: Context): Promise<Response> {
    try {
      const { email, password } = c.get('validatedData') as { email: string, password: string };
      
      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
      }
      
      // Generate JWT token
      const token = await AuthController.generateToken(user.id, user.username);
      
      // Generate refresh token
      const refreshToken = await AuthController.generateRefreshToken(user.id, user.username);
      
      return c.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token,
        refreshToken
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to login');
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
          throw ApiError.unauthorized('User no longer exists');
        }
        
        // Generate new access token
        const newToken = await AuthController.generateToken(userId, username);
        
        return c.json({
          message: 'Token refreshed successfully',
          token: newToken
        });
      } catch (error) {
        throw ApiError.unauthorized('Invalid or expired refresh token');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to refresh token');
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