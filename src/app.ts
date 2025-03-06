import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger as requestLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { config } from './utils/config';
import logger from './utils/logger';
import { ApiError } from './utils/error';

// Import routes
import authRoutes from './routes/auth.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import categoryRoutes from './routes/category.routes';
import { setupSwagger } from './utils/swagger';
import { standardizeResponse } from './middlewares/response.middleware';
import { sendError } from './utils/response';

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', requestLogger());
app.use('*', cors());
app.use('*', standardizeResponse); // 

// Swagger documentation
app.get(
  '/docs',
  swaggerUI({
    url: '/docs/openapi.json',
  })
);

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.route('/auth', authRoutes);
app.route('/bookmarks', bookmarkRoutes);
app.route('/categories', categoryRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Error handling middleware
app.onError((err, c) => {
    logger.error(err);
  
    if (err instanceof ApiError) {
      return sendError(
        c,
        err.message,
        err.errors,
        err.statusCode
      );
    }
  
    return sendError(
      c,
      'Internal Server Error'
    );
  });
  
  // Handle 404 - Route not found
  app.notFound((c) => {
    return sendError(
      c,
      `Route not found for ${c.req.method} ${c.req.url}`,
      undefined,
      404,
      'ROUTE_NOT_FOUND'
    );
  });

// Start server
if (process.env.NODE_ENV !== 'test') {
  serve({
    fetch: app.fetch,
    port: config.port,
  }, (info) => {
    logger.info(`Server running at http://localhost:${info.port}`);
  });
}

export default app;