import db from '../utils/db';
import { ApiError } from '../utils/error';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

export class UserModel {
  static async create(user: UserCreate): Promise<User> {
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [user.username, user.email, user.password];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint.includes('username')) {
          throw ApiError.conflict('Username already exists');
        } else if (error.constraint.includes('email')) {
          throw ApiError.conflict('Email already exists');
        }
      }
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }
}