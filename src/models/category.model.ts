import db from '../utils/db';
import { ApiError } from '../utils/error';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryCreate {
  user_id: number;
  name: string;
}

export interface CategoryUpdate {
  name: string;
}

export class CategoryModel {
  static async create(category: CategoryCreate): Promise<Category> {
    const query = `
      INSERT INTO categories (user_id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [category.user_id, category.name]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw ApiError.conflict('Category with this name already exists');
      }
      throw error;
    }
  }

  static async update(id: number, userId: number, category: CategoryUpdate): Promise<Category> {
    const query = `
      UPDATE categories
      SET name = $1, updated_at = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [category.name, new Date(), id, userId]);
      
      if (result.rows.length === 0) {
        throw ApiError.notFound('Category not found or you do not have permission to update it');
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw ApiError.conflict('Category with this name already exists');
      }
      throw error;
    }
  }

  static async delete(id: number, userId: number): Promise<void> {
    // Count bookmarks in this category
    const countQuery = `
      SELECT COUNT(*) FROM bookmarks
      WHERE category_id = $1 AND user_id = $2
    `;
    
    const countResult = await db.query(countQuery, [id, userId]);
    const bookmarkCount = parseInt(countResult.rows[0].count, 10);
    
    if (bookmarkCount > 0) {
      throw ApiError.conflict(`Cannot delete category with ${bookmarkCount} bookmarks. 
        Remove or reassign the bookmarks first.`);
    }
    
    const query = 'DELETE FROM categories WHERE id = $1 AND user_id = $2';
    const result = await db.query(query, [id, userId]);
    
    if (result.rowCount === 0) {
      throw ApiError.notFound('Category not found or you do not have permission to delete it');
    }
  }

  static async findById(id: number): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<Category[]> {
    const query = `
      SELECT c.*, COUNT(b.id) as bookmark_count
      FROM categories c
      LEFT JOIN bookmarks b ON c.id = b.category_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.name
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }
}