import { Context } from 'hono';
import { z } from 'zod';
import { CategoryModel, CategoryCreate, CategoryUpdate } from '../models/category.model';
import { ApiError } from '../utils/error';
import { sendSuccess, sendError } from '../utils/response';

// Define validation schema for creating category
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100)
});

// Define validation schema for updating category
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100)
});

export class CategoryController {
  // Create a new category
  static async create(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const { name } = c.get('validatedData') as z.infer<typeof createCategorySchema>;
      
      const categoryData: CategoryCreate = {
        user_id: userId,
        name
      };
      
      const category = await CategoryModel.create(categoryData);
      
      return sendSuccess(
        c,
        { category },
        'Category created successfully',
        'CATEGORY_CREATED',
        201
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to create category');
    }
  }
  
  // Get all categories for authenticated user
  static async getAll(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      
      const categories = await CategoryModel.findByUserId(userId);
      
      return sendSuccess(
        c,
        { categories },
        'Categories retrieved successfully',
        'CATEGORIES_RETRIEVED'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to retrieve categories');
    }
  }
  
  // Update a category
  static async update(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const categoryId = parseInt(c.req.param('id'));
      const { name } = c.get('validatedData') as z.infer<typeof updateCategorySchema>;
      
      try {
        const category = await CategoryModel.update(categoryId, userId, { name });
        
        return sendSuccess(
          c,
          { category },
          'Category updated successfully',
          'CATEGORY_UPDATED'
        );
      } catch (error) {
        if (error instanceof ApiError) {
          // Tangani error spesifik dari model
          if (error.statusCode === 404) {
            return sendError(c, error.message, undefined, 404, 'CATEGORY_NOT_FOUND');
          } else if (error.statusCode === 409) {
            return sendError(c, error.message, undefined, 409, 'CATEGORY_NAME_CONFLICT');
          }
          return sendError(c, error.message, error.errors, error.statusCode);
        }
        throw error; // Re-throw jika bukan ApiError
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to update category');
    }
  }
  
  // Delete a category
  static async delete(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const categoryId = parseInt(c.req.param('id'));
      
      try {
        await CategoryModel.delete(categoryId, userId);
        
        return sendSuccess(
          c,
          null,
          'Category deleted successfully',
          'CATEGORY_DELETED'
        );
      } catch (error) {
        if (error instanceof ApiError) {
          // Tangani error spesifik dari model
          if (error.statusCode === 404) {
            return sendError(c, error.message, undefined, 404, 'CATEGORY_NOT_FOUND');
          } else if (error.statusCode === 409) {
            return sendError(c, error.message, undefined, 409, 'CATEGORY_HAS_BOOKMARKS');
          }
          return sendError(c, error.message, error.errors, error.statusCode);
        }
        throw error; // Re-throw jika bukan ApiError
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to delete category');
    }
  }
}