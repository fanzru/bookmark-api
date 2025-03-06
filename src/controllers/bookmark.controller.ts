import { Context } from 'hono';
import { z } from 'zod';
import { BookmarkModel, BookmarkCreate, BookmarkUpdate } from '../models/bookmark.model';
import { TagModel } from '../models/tag.model';
import { ApiError } from '../utils/error';
import { sendSuccess, sendError } from '../utils/response';

// Define validation schema for creating bookmark
export const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category_id: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional()
});

// Define validation schema for updating bookmark
export const updateBookmarkSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional()
});

// Define validation schema for bookmark query
export const bookmarkQuerySchema = z.object({
  category_id: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

export class BookmarkController {
  // Create a new bookmark
  static async create(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const data = c.get('validatedData') as z.infer<typeof createBookmarkSchema>;
      
      // Create bookmark
      const bookmarkData: BookmarkCreate = {
        user_id: userId,
        url: data.url,
        title: data.title,
        description: data.description,
        category_id: data.category_id
      };
      
      const bookmark = await BookmarkModel.create(bookmarkData);
      
      // Process tags if provided
      if (data.tags && data.tags.length > 0) {
        const tagIds = [];
        
        // Find or create tags
        for (const tagName of data.tags) {
          const tag = await TagModel.findOrCreate(tagName);
          tagIds.push(tag.id);
        }
        
        // Associate tags with bookmark
        if (tagIds.length > 0) {
          await BookmarkModel.addTags(bookmark.id, userId, tagIds);
        }
      }
      
      // Fetch the created bookmark with tags
      const createdBookmark = await BookmarkModel.findById(bookmark.id);
      const tags = await BookmarkModel.getTagsForBookmark(bookmark.id);
      
      return sendSuccess(
        c,
        {
          bookmark: {
            ...createdBookmark,
            tags
          }
        },
        'Bookmark created successfully',
        'BOOKMARK_CREATED',
        201
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to create bookmark');
    }
  }
  
  // Get all bookmarks for authenticated user
  static async getAll(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      
      // Parse query parameters
      const queryParams = c.req.query();
      
      const categoryId = queryParams.category_id ? parseInt(queryParams.category_id) : undefined;
      const search = queryParams.search;
      const tags = queryParams.tags ? queryParams.tags.split(',') : undefined;
      const page = queryParams.page ? parseInt(queryParams.page) : 1;
      const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
      
      // Fetch bookmarks
      const { bookmarks, total } = await BookmarkModel.findAll({
        user_id: userId,
        category_id: categoryId,
        search,
        tags,
        page,
        limit
      });
      
      // Fetch tags for each bookmark
      const bookmarksWithTags = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const tags = await BookmarkModel.getTagsForBookmark(bookmark.id);
          return {
            ...bookmark,
            tags
          };
        })
      );
      
      return sendSuccess(
        c,
        {
          bookmarks: bookmarksWithTags,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
        'Bookmarks retrieved successfully',
        'BOOKMARKS_RETRIEVED'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to retrieve bookmarks');
    }
  }
  
  // Get a specific bookmark by ID
  static async getById(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const bookmarkId = parseInt(c.req.param('id'));
      
      // Fetch bookmark
      const bookmark = await BookmarkModel.findById(bookmarkId);
      
      if (!bookmark) {
        return sendError(c, 'Bookmark not found', undefined, 404, 'BOOKMARK_NOT_FOUND');
      }
      
      // Check if bookmark belongs to user
      if (bookmark.user_id !== userId) {
        return sendError(c, 'You do not have permission to view this bookmark', undefined, 403, 'PERMISSION_DENIED');
      }
      
      // Fetch tags for bookmark
      const tags = await BookmarkModel.getTagsForBookmark(bookmarkId);
      
      return sendSuccess(
        c,
        {
          bookmark: {
            ...bookmark,
            tags
          }
        },
        'Bookmark retrieved successfully',
        'BOOKMARK_RETRIEVED'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to retrieve bookmark');
    }
  }
  
  // Update a bookmark
  static async update(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const bookmarkId = parseInt(c.req.param('id'));
      const data = c.get('validatedData') as z.infer<typeof updateBookmarkSchema>;
      
      // Check if bookmark exists and belongs to user
      const bookmark = await BookmarkModel.findById(bookmarkId);
      
      if (!bookmark) {
        return sendError(c, 'Bookmark not found', undefined, 404, 'BOOKMARK_NOT_FOUND');
      }
      
      if (bookmark.user_id !== userId) {
        return sendError(c, 'You do not have permission to update this bookmark', undefined, 403, 'PERMISSION_DENIED');
      }
      
      // Update bookmark data
      const bookmarkData: BookmarkUpdate = {};
      
      if (data.url !== undefined) bookmarkData.url = data.url;
      if (data.title !== undefined) bookmarkData.title = data.title;
      if (data.description !== undefined) bookmarkData.description = data.description;
      if (data.category_id !== undefined) bookmarkData.category_id = data.category_id;
      
      const updatedBookmark = await BookmarkModel.update(bookmarkId, userId, bookmarkData);
      
      // Process tags if provided
      if (data.tags !== undefined) {
        // Get existing tags
        const existingTags = await BookmarkModel.getTagsForBookmark(bookmarkId);
        const existingTagNames = existingTags.map(tag => tag.name);
        
        // Find tags to add
        const tagsToAdd = data.tags.filter(tag => !existingTagNames.includes(tag));
        
        // Find tags to remove
        const tagsToRemove = existingTags.filter(tag => !data.tags!.includes(tag.name));
        
        // Add new tags
        if (tagsToAdd.length > 0) {
          const tagIds = [];
          
          for (const tagName of tagsToAdd) {
            const tag = await TagModel.findOrCreate(tagName);
            tagIds.push(tag.id);
          }
          
          await BookmarkModel.addTags(bookmarkId, userId, tagIds);
        }
        
        // Remove tags
        if (tagsToRemove.length > 0) {
          const tagIds = tagsToRemove.map(tag => tag.id);
          await BookmarkModel.removeTags(bookmarkId, userId, tagIds);
        }
      }
      
      // Fetch updated bookmark with tags
      const tags = await BookmarkModel.getTagsForBookmark(bookmarkId);
      
      return sendSuccess(
        c,
        {
          bookmark: {
            ...updatedBookmark,
            tags
          }
        },
        'Bookmark updated successfully',
        'BOOKMARK_UPDATED'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to update bookmark');
    }
  }
  
  // Delete a bookmark
  static async delete(c: Context): Promise<Response> {
    try {
      const userId = c.get('userId');
      const bookmarkId = parseInt(c.req.param('id'));
      
      await BookmarkModel.delete(bookmarkId, userId);
      
      return sendSuccess(
        c,
        null,
        'Bookmark deleted successfully',
        'BOOKMARK_DELETED'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(c, error.message, error.errors, error.statusCode);
      }
      return sendError(c, 'Failed to delete bookmark');
    }
  }
}