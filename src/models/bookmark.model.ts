import db from '../utils/db';
import { ApiError } from '../utils/error';

export interface Bookmark {
  id: number;
  user_id: number;
  category_id: number | null;
  url: string;
  title: string;
  description: string | null;
  preview_image: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BookmarkCreate {
  user_id: number;
  category_id?: number;
  url: string;
  title: string;
  description?: string;
  preview_image?: string;
}

export interface BookmarkUpdate {
  category_id?: number | null;
  url?: string;
  title?: string;
  description?: string | null;
  preview_image?: string | null;
}

export interface BookmarkQuery {
  user_id: number;
  category_id?: number;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class BookmarkModel {
  static async create(bookmark: BookmarkCreate): Promise<Bookmark> {
    const query = `
      INSERT INTO bookmarks (
        user_id, category_id, url, title, description, preview_image
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      bookmark.user_id, 
      bookmark.category_id || null, 
      bookmark.url, 
      bookmark.title, 
      bookmark.description || null, 
      bookmark.preview_image || null
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key violation
        throw ApiError.badRequest('Invalid category ID');
      }
      throw error;
    }
  }

  static async update(id: number, userId: number, bookmark: BookmarkUpdate): Promise<Bookmark> {
    // Check if bookmark exists and belongs to user
    const existingBookmark = await this.findById(id);
    
    if (!existingBookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    if (existingBookmark.user_id !== userId) {
      throw ApiError.forbidden('You do not have permission to update this bookmark');
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (bookmark.category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(bookmark.category_id === null ? null : bookmark.category_id);
    }
    
    if (bookmark.url) {
      updates.push(`url = $${paramCount++}`);
      values.push(bookmark.url);
    }
    
    if (bookmark.title) {
      updates.push(`title = $${paramCount++}`);
      values.push(bookmark.title);
    }
    
    if (bookmark.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(bookmark.description);
    }
    
    if (bookmark.preview_image !== undefined) {
      updates.push(`preview_image = $${paramCount++}`);
      values.push(bookmark.preview_image);
    }
    
    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    
    // Add bookmark id and user_id to values array
    values.push(id);
    values.push(userId);

    const query = `
      UPDATE bookmarks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw ApiError.notFound('Bookmark not found');
      }
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key violation
        throw ApiError.badRequest('Invalid category ID');
      }
      throw error;
    }
  }

  static async delete(id: number, userId: number): Promise<void> {
    const query = 'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2';
    
    const result = await db.query(query, [id, userId]);
    
    if (result.rowCount === 0) {
      throw ApiError.notFound('Bookmark not found or you do not have permission to delete it');
    }
  }

  static async findById(id: number): Promise<Bookmark | null> {
    const query = 'SELECT * FROM bookmarks WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findAll(params: BookmarkQuery): Promise<{ bookmarks: Bookmark[], total: number }> {
    const { user_id, category_id, search, tags, page = 1, limit = 10 } = params;
    
    const offset = (page - 1) * limit;
    const queryParams: any[] = [user_id];
    let paramCount = 1;

    let query = `
      SELECT b.* FROM bookmarks b
    `;
    
    // Join with bookmark_tags if tags are provided
    if (tags && tags.length > 0) {
      query += `
        JOIN bookmark_tags bt ON b.id = bt.bookmark_id
        JOIN tags t ON bt.tag_id = t.id
      `;
    }
    
    query += ` WHERE b.user_id = $${paramCount++}`;
    
    if (category_id) {
      query += ` AND b.category_id = $${paramCount++}`;
      queryParams.push(category_id);
    }
    
    if (search) {
      query += ` AND (
        b.title ILIKE $${paramCount++} OR 
        b.description ILIKE $${paramCount++} OR 
        b.url ILIKE $${paramCount++}
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (tags && tags.length > 0) {
      query += ` AND t.name = ANY($${paramCount++})`;
      queryParams.push(tags);
    }
    
    // Count total before adding limit and offset
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Add order, limit and offset
    query += `
      ORDER BY b.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    return {
      bookmarks: result.rows,
      total
    };
  }

  static async addTags(bookmarkId: number, userId: number, tagIds: number[]): Promise<void> {
    // Verify bookmark belongs to user
    const bookmark = await this.findById(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    if (bookmark.user_id !== userId) {
      throw ApiError.forbidden('You do not have permission to update this bookmark');
    }

    // Create values for batch insert
    const values = tagIds.map(tagId => `(${bookmarkId}, ${tagId})`).join(', ');
    
    if (!values) return;
    
    const query = `
      INSERT INTO bookmark_tags (bookmark_id, tag_id)
      VALUES ${values}
      ON CONFLICT (bookmark_id, tag_id) DO NOTHING
    `;
    
    await db.query(query);
  }

  static async removeTags(bookmarkId: number, userId: number, tagIds: number[]): Promise<void> {
    // Verify bookmark belongs to user
    const bookmark = await this.findById(bookmarkId);
    
    if (!bookmark) {
      throw ApiError.notFound('Bookmark not found');
    }
    
    if (bookmark.user_id !== userId) {
      throw ApiError.forbidden('You do not have permission to update this bookmark');
    }

    const query = `
      DELETE FROM bookmark_tags 
      WHERE bookmark_id = $1 AND tag_id = ANY($2::int[])
    `;
    
    await db.query(query, [bookmarkId, tagIds]);
  }

  static async getTagsForBookmark(bookmarkId: number): Promise<{ id: number, name: string }[]> {
    const query = `
      SELECT t.id, t.name 
      FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE bt.bookmark_id = $1
    `;
    
    const result = await db.query(query, [bookmarkId]);
    return result.rows;
  }
}