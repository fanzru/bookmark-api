import db from '../utils/db';
import { ApiError } from '../utils/error';

export interface Tag {
  id: number;
  name: string;
  created_at: Date;
}

export class TagModel {
  static async findOrCreate(name: string): Promise<Tag> {
    // Normalize tag name (lowercase, trim)
    const normalizedName = name.toLowerCase().trim();
    
    // Check if tag already exists
    const existingTag = await this.findByName(normalizedName);
    if (existingTag) {
      return existingTag;
    }
    
    // Create new tag
    const query = `
      INSERT INTO tags (name)
      VALUES ($1)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [normalizedName]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        // Double-check in case of race condition
        const tag = await this.findByName(normalizedName);
        if (tag) {
          return tag;
        }
      }
      throw error;
    }
  }

  static async findById(id: number): Promise<Tag | null> {
    const query = 'SELECT * FROM tags WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<Tag | null> {
    const query = 'SELECT * FROM tags WHERE name = $1';
    const result = await db.query(query, [name]);
    return result.rows[0] || null;
  }

  static async findAll(): Promise<Tag[]> {
    const query = 'SELECT * FROM tags ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  }

  static async findByIds(ids: number[]): Promise<Tag[]> {
    if (!ids.length) return [];
    
    const query = 'SELECT * FROM tags WHERE id = ANY($1::int[])';
    const result = await db.query(query, [ids]);
    return result.rows;
  }

  static async findPopularTags(limit: number = 10): Promise<{ id: number, name: string, count: number }[]> {
    const query = `
      SELECT t.id, t.name, COUNT(bt.bookmark_id) as count
      FROM tags t
      JOIN bookmark_tags bt ON t.id = bt.tag_id
      GROUP BY t.id, t.name
      ORDER BY count DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }
}