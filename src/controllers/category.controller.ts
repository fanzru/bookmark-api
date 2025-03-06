import { Context } from 'hono';
import { z } from 'zod';
import { CategoryModel, CategoryCreate, CategoryUpdate } from '../models/category.model';
import { ApiError } from '../utils/error';

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
      
      return c.json({
        message: 'Category created successfully',
        category
      }, 201);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to create category');
    }
  }
  
  // Get all categories for authenticated user
  static async getAll(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      
      const categories = await CategoryModel.findByUserId(userId);
      
      return c.json({
        categories
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to retrieve categories');
    }
  }
  
  // Update a category
  static async update(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const categoryId = parseInt(c.req.param('id'));
      const { name } = c.get('validatedData') as z.infer<typeof updateCategorySchema>;
      
      const categoryData: CategoryUpdate = {
        name
      };
      
      const category = await CategoryModel.update(categoryId, userId, categoryData);
      
      return c.json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to update category');
    }
  }
  
  // Delete a category
  static async delete(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const categoryId = parseInt(c.req.param('id'));
      
      await CategoryModel.delete(categoryId, userId);
      
      return c.json({
        message: 'Category deleted successfully'
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internalServer('Failed to delete category');
    }
  }
}