# Bookmark Management API

A RESTful API for managing bookmarks with categorization, tagging, and search capabilities. Built with Hono.js, TypeScript, and PostgreSQL.

## Features

- User registration and authentication with JWT
- CRUD operations for bookmarks
- Bookmark categorization
- Tagging system
- Search and filtering capabilities
- Rate limiting for security
- Standardized API response format

## Tech Stack

- **Backend**: Hono.js, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- PNPM

## Getting Started

### Setup with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bookmark-api.git
   cd bookmark-api
   ```

2. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

3. Start the application and database with Docker Compose:
   ```bash
   docker-compose up
   ```

   This will start:
   - PostgreSQL database (port 5432)
   - pgAdmin (port 5050) - access via http://localhost:5050
   - The API (port 3000)

4. The API will be accessible at: http://localhost:3000
5. API documentation will be available at: http://localhost:3000/docs

### Manual Setup (without Docker)

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/bookmark-api.git
   cd bookmark-api
   pnpm install
   ```

2. Create `.env` file and configure database connection:
   ```bash
   cp .env.example .env
   ```

3. Create PostgreSQL database and run migrations:
   ```bash
   psql -U postgres
   ```
   
   ```sql
   CREATE DATABASE bookmarkdb;
   CREATE USER bookmarkuser WITH PASSWORD 'bookmarkpassword';
   GRANT ALL PRIVILEGES ON DATABASE bookmarkdb TO bookmarkuser;
   \q
   ```
   
   ```bash
   psql -U bookmarkuser -d bookmarkdb -f sql/00001_init_apps.up.sql
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | API server port | 3000 |
| NODE_ENV | Environment | development |
| DATABASE_URL | PostgreSQL connection string | postgres://bookmarkuser:bookmarkpassword@localhost:5432/bookmarkdb |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRES_IN | JWT expiration time | 24h |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token expiration | 7d |
| LOG_LEVEL | Logging level | info |

## API Documentation

The API is documented using Swagger/OpenAPI. When the server is running, visit:
http://localhost:3000/docs

## API Response Format

All API responses use the following standard format:

### Success Response

```json
{
  "code": "SUCCESS",
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "serverTime": 1741289150000
}
```

### Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Error message",
  "serverTime": 1741289150000,
  "error": {
    "message": "Error message",
    "details": [
      {
        "path": "field_name",
        "message": "Error detail"
      }
    ]
  }
}
```

## Error Codes

- `BAD_REQUEST` - Invalid request (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Conflict with existing resource (409)
- `VALIDATION_ERROR` - Input validation error (422)
- `TOO_MANY_REQUESTS` - Rate limit exceeded (429)
- `INTERNAL_SERVER_ERROR` - Internal server error (500)

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `POST /auth/refresh-token` - Refresh access token

### Bookmarks

- `GET /bookmarks` - Get all bookmarks
- `POST /bookmarks` - Create a new bookmark
- `GET /bookmarks/{id}` - Get a specific bookmark by ID
- `PUT /bookmarks/{id}` - Update a bookmark
- `DELETE /bookmarks/{id}` - Delete a bookmark

### Categories

- `GET /categories` - Get all categories
- `POST /categories` - Create a new category
- `PUT /categories/{id}` - Update a category
- `DELETE /categories/{id}` - Delete a category

## Project Structure

```
bookmark-api/
├── src/              # Source code
│   ├── controllers/  # Request handlers
│   ├── middlewares/  # Custom middlewares
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   └── app.ts        # Application entry point
├── tests/            # Unit & integration tests
├── docs/             # Documentation
│   └── rfc.md        # RFC document
├── sql/              # SQL migrations
│   ├── 00001_init_apps.up.sql
│   └── 00001_init_apps.down.sql
├── postman/          # Postman collection
└── ...
```

## Rate Limiting

The API uses rate limiting to protect against attacks and abuse:

- Authentication endpoints: 10 requests per 15 minutes
- Standard endpoints: 30 requests per minute

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

MIT