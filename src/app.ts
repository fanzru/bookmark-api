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

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', requestLogger());
app.use('*', cors());

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

// Error handling middleware
app.onError((err, c) => {
  logger.error(err);

  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          message: err.message,
          ...(err.errors && { details: err.errors }),
        },
      },
      err.statusCode as 400 | 401 | 403 | 404 | 500
    );
  }

  return c.json(
    {
      error: {
        message: 'Internal Server Error',
      },
    },
    500
  );
});

// Handle 404 - Route not found
app.notFound((c) => {
  return c.json(
    {
      error: {
        message: 'Not Found',
        details: `No route found for ${c.req.method} ${c.req.url}`,
      },
    },
    404
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