import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';

export const setupSwagger = (app: Hono) => {
  // Define OpenAPI document
  const openAPIDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Bookmark Management API',
      version: '1.0.0',
      description: 'RESTful API for managing bookmarks',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        // Bookmark schemas
        Bookmark: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            category_id: { type: 'integer', nullable: true },
            url: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            preview_image: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        // Category schemas
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            bookmark_count: { type: 'integer' }
          }
        },
        // Error response
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Bookmarks', description: 'Bookmark management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' }
    ],
    paths: {
      // Authentication endpoints
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password'],
                  properties: {
                    username: { type: 'string', minLength: 3, maxLength: 50 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8, maxLength: 100 }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'User registered successfully' },
            '400': { description: 'Invalid input data' },
            '409': { description: 'Username or email already exists' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login a user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Login successful' },
            '401': { description: 'Invalid email or password' }
          }
        }
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Token refreshed successfully' },
            '401': { description: 'Invalid or expired refresh token' }
          }
        }
      },
      
      // Bookmark endpoints
      '/bookmarks': {
        get: {
          tags: ['Bookmarks'],
          summary: 'Get all bookmarks for authenticated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { 
              name: 'category_id', 
              in: 'query',
              schema: { type: 'integer' },
              description: 'Filter by category ID'
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search term for title, description or URL'
            },
            {
              name: 'tags',
              in: 'query',
              schema: { type: 'string' },
              description: 'Comma-separated list of tag names'
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page'
            }
          ],
          responses: {
            '200': { description: 'List of bookmarks' },
            '401': { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Bookmarks'],
          summary: 'Create a new bookmark',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['url', 'title'],
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    title: { type: 'string', maxLength: 255 },
                    description: { type: 'string', maxLength: 1000 },
                    category_id: { type: 'integer' },
                    tags: { 
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Bookmark created successfully' },
            '400': { description: 'Invalid input data' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/bookmarks/{id}': {
        get: {
          tags: ['Bookmarks'],
          summary: 'Get a specific bookmark by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Bookmark ID'
            }
          ],
          responses: {
            '200': { description: 'Bookmark details' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Bookmark not found' }
          }
        },
        put: {
          tags: ['Bookmarks'],
          summary: 'Update a bookmark',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Bookmark ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    title: { type: 'string', maxLength: 255 },
                    description: { 
                      type: 'string', 
                      maxLength: 1000,
                      nullable: true 
                    },
                    category_id: { 
                      type: 'integer',
                      nullable: true 
                    },
                    tags: { 
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Bookmark updated successfully' },
            '400': { description: 'Invalid input data' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Bookmark not found' }
          }
        },
        delete: {
          tags: ['Bookmarks'],
          summary: 'Delete a bookmark',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Bookmark ID'
            }
          ],
          responses: {
            '200': { description: 'Bookmark deleted successfully' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Bookmark not found' }
          }
        }
      },
      
      // Category endpoints
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Get all categories for authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of categories' },
            '401': { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Categories'],
          summary: 'Create a new category',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { 
                      type: 'string',
                      minLength: 1,
                      maxLength: 100
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Category created successfully' },
            '400': { description: 'Invalid input data' },
            '401': { description: 'Unauthorized' },
            '409': { description: 'Category with this name already exists' }
          }
        }
      },
      '/categories/{id}': {
        put: {
          tags: ['Categories'],
          summary: 'Update a category',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Category ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { 
                      type: 'string',
                      minLength: 1,
                      maxLength: 100
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Category updated successfully' },
            '400': { description: 'Invalid input data' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Category not found' },
            '409': { description: 'Category with this name already exists' }
          }
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete a category',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Category ID'
            }
          ],
          responses: {
            '200': { description: 'Category deleted successfully' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
            '404': { description: 'Category not found' },
            '409': { description: 'Cannot delete category with bookmarks' }
          }
        }
      }
    }
  };

  // Serve OpenAPI document as JSON
  app.get('/docs/openapi.json', (c) => {
    return c.json(openAPIDocument);
  });
  
  // Serve Swagger UI
  app.get('/docs', swaggerUI({ url: '/docs/openapi.json' }));

  return app;
};