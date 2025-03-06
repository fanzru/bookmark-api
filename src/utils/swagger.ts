import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

export const setupSwagger = (app: OpenAPIHono) => {
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
    ]
  };

  // Serve Swagger UI
  app.get('/docs', swaggerUI({ url: '/docs/openapi.json' }));
  
  // Serve OpenAPI document as JSON
  app.get('/docs/openapi.json', (c) => {
    return c.json(openAPIDocument);
  });

  return app;
};