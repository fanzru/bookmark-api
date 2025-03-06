# RFC: Bookmark Management API

## 1. Introduction

This document outlines the design and implementation of a RESTful API for a bookmark management system. The API allows users to register, authenticate, and manage their bookmarks with features such as categorization, tagging, searching, and filtering.

## 2. System Overview

The Bookmark Management API is built using the following tech stack:
- **Backend**: Hono.js with TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

### 2.1 Key Features

- User registration and authentication
- CRUD operations for bookmarks
- Bookmark categorization
- Tagging system
- Search and filtering capabilities
- Rate limiting
- API documentation
- Standardized API response format

### 2.2 Architecture

The application follows a layered architecture:

- **Routes Layer**: Defines API endpoints and request validation
- **Controller Layer**: Handles request/response logic
- **Service Layer**: Contains business logic
- **Model Layer**: Database interactions
- **Middleware Layer**: Cross-cutting concerns (authentication, validation, etc.)
- **Utilities**: Helper functions, logging, error handling, etc.

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
+----------+       +------------+       +--------+
|          |       |            |       |        |
|  Users   +-------+ Bookmarks  +-------+  Tags  |
|          |       |            |       |        |
+----------+       +-----+------+       +--------+
                         |
                         |
                   +-----+------+
                   |            |
                   | Categories |
                   |            |
                   +------------+
```

### 3.2 Tables

#### Users Table
- `id`: SERIAL PRIMARY KEY
- `username`: VARCHAR(50) UNIQUE NOT NULL
- `email`: VARCHAR(100) UNIQUE NOT NULL
- `password`: VARCHAR(255) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

#### Categories Table
- `id`: SERIAL PRIMARY KEY
- `user_id`: INTEGER REFERENCES users(id)
- `name`: VARCHAR(100) NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE
- UNIQUE(user_id, name)

#### Bookmarks Table
- `id`: SERIAL PRIMARY KEY
- `user_id`: INTEGER REFERENCES users(id)
- `category_id`: INTEGER REFERENCES categories(id)
- `url`: VARCHAR(2048) NOT NULL
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `preview_image`: VARCHAR(2048)
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

#### Tags Table
- `id`: SERIAL PRIMARY KEY
- `name`: VARCHAR(50) UNIQUE NOT NULL
- `created_at`: TIMESTAMP WITH TIME ZONE

#### BookmarkTags Table (Junction Table)
- `bookmark_id`: INTEGER REFERENCES bookmarks(id)
- `tag_id`: INTEGER REFERENCES tags(id)
- PRIMARY KEY (bookmark_id, tag_id)

## 4. API Endpoints

### 4.1 Authentication

#### POST /auth/register
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "code": "USER_REGISTERED",
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "number",
        "username": "string",
        "email": "string"
      },
      "token": "string",
      "refreshToken": "string"
    },
    "serverTime": "number"
  }
  ```

#### POST /auth/login
- **Description**: Login a user
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "code": "LOGIN_SUCCESS",
    "message": "Login successful",
    "data": {
      "user": {
        "id": "number",
        "username": "string",
        "email": "string"
      },
      "token": "string",
      "refreshToken": "string"
    },
    "serverTime": "number"
  }
  ```

#### POST /auth/refresh-token
- **Description**: Refresh access token
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response**:
  ```json
  {
    "code": "TOKEN_REFRESHED",
    "message": "Token refreshed successfully",
    "data": {
      "token": "string"
    },
    "serverTime": "number"
  }
  ```

### 4.2 Bookmark Management

#### GET /bookmarks
- **Description**: Get all bookmarks for authenticated user
- **Authentication**: Required
- **Query Parameters**:
  - `category_id`: Filter by category ID
  - `search`: Search term for title, description or URL
  - `tags`: Comma-separated list of tag names
  - `page`: Page number (default: 1)
  - `limit`: Number of items per page (default: 10)
- **Response**:
  ```json
  {
    "code": "BOOKMARKS_RETRIEVED",
    "message": "Bookmarks retrieved successfully",
    "data": {
      "bookmarks": [
        {
          "id": "number",
          "user_id": "number",
          "category_id": "number",
          "url": "string",
          "title": "string",
          "description": "string",
          "preview_image": "string",
          "created_at": "string",
          "updated_at": "string",
          "tags": [
            {
              "id": "number",
              "name": "string"
            }
          ]
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "pages": "number"
      }
    },
    "serverTime": "number"
  }
  ```

#### POST /bookmarks
- **Description**: Create a new bookmark
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "url": "string",
    "title": "string",
    "description": "string",
    "category_id": "number",
    "tags": ["string"]
  }
  ```
- **Response**:
  ```json
  {
    "code": "BOOKMARK_CREATED",
    "message": "Bookmark created successfully",
    "data": {
      "bookmark": {
        "id": "number",
        "user_id": "number",
        "category_id": "number",
        "url": "string",
        "title": "string",
        "description": "string",
        "preview_image": "string",
        "created_at": "string",
        "updated_at": "string",
        "tags": [
          {
            "id": "number",
            "name": "string"
          }
        ]
      }
    },
    "serverTime": "number"
  }
  ```

#### GET /bookmarks/{id}
- **Description**: Get a specific bookmark by ID
- **Authentication**: Required
- **Parameters**: `id` (bookmark ID)
- **Response**:
  ```json
  {
    "code": "BOOKMARK_RETRIEVED",
    "message": "Bookmark retrieved successfully",
    "data": {
      "bookmark": {
        "id": "number",
        "user_id": "number",
        "category_id": "number",
        "url": "string",
        "title": "string",
        "description": "string",
        "preview_image": "string",
        "created_at": "string",
        "updated_at": "string",
        "tags": [
          {
            "id": "number",
            "name": "string"
          }
        ]
      }
    },
    "serverTime": "number"
  }
  ```

#### PUT /bookmarks/{id}
- **Description**: Update a bookmark
- **Authentication**: Required
- **Parameters**: `id` (bookmark ID)
- **Request Body**:
  ```json
  {
    "url": "string",
    "title": "string",
    "description": "string",
    "category_id": "number",
    "tags": ["string"]
  }
  ```
- **Response**:
  ```json
  {
    "code": "BOOKMARK_UPDATED",
    "message": "Bookmark updated successfully",
    "data": {
      "bookmark": {
        "id": "number",
        "user_id": "number",
        "category_id": "number",
        "url": "string",
        "title": "string",
        "description": "string",
        "preview_image": "string",
        "created_at": "string",
        "updated_at": "string",
        "tags": [
          {
            "id": "number",
            "name": "string"
          }
        ]
      }
    },
    "serverTime": "number"
  }
  ```

#### DELETE /bookmarks/{id}
- **Description**: Delete a bookmark
- **Authentication**: Required
- **Parameters**: `id` (bookmark ID)
- **Response**:
  ```json
  {
    "code": "BOOKMARK_DELETED",
    "message": "Bookmark deleted successfully",
    "data": null,
    "serverTime": "number"
  }
  ```

### 4.3 Category Management

#### GET /categories
- **Description**: Get all categories for authenticated user
- **Authentication**: Required
- **Response**:
  ```json
  {
    "code": "CATEGORIES_RETRIEVED",
    "message": "Categories retrieved successfully",
    "data": {
      "categories": [
        {
          "id": "number",
          "user_id": "number",
          "name": "string",
          "created_at": "string",
          "updated_at": "string",
          "bookmark_count": "number"
        }
      ]
    },
    "serverTime": "number"
  }
  ```

#### POST /categories
- **Description**: Create a new category
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "string"
  }
  ```
- **Response**:
  ```json
  {
    "code": "CATEGORY_CREATED",
    "message": "Category created successfully",
    "data": {
      "category": {
        "id": "number",
        "user_id": "number",
        "name": "string",
        "created_at": "string",
        "updated_at": "string"
      }
    },
    "serverTime": "number"
  }
  ```

#### PUT /categories/{id}
- **Description**: Update a category
- **Authentication**: Required
- **Parameters**: `id` (category ID)
- **Request Body**:
  ```json
  {
    "name": "string"
  }
  ```
- **Response**:
  ```json
  {
    "code": "CATEGORY_UPDATED",
    "message": "Category updated successfully",
    "data": {
      "category": {
        "id": "number",
        "user_id": "number",
        "name": "string",
        "created_at": "string",
        "updated_at": "string"
      }
    },
    "serverTime": "number"
  }
  ```

#### DELETE /categories/{id}
- **Description**: Delete a category
- **Authentication**: Required
- **Parameters**: `id` (category ID)
- **Response**:
  ```json
  {
    "code": "CATEGORY_DELETED",
    "message": "Category deleted successfully",
    "data": null,
    "serverTime": "number"
  }
  ```

## 5. Authentication Mechanism

The API uses JWT (JSON Web Tokens) for authentication:

1. When a user registers or logs in, the server generates two tokens:
   - **Access Token**: Short-lived token (24h by default) used for API authentication
   - **Refresh Token**: Long-lived token (7d by default) used to obtain new access tokens

2. For protected routes, the client must include the access token in the Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```

3. When the access token expires, the client can use the refresh token to obtain a new access token without requiring the user to log in again.

## 6. Standardized Response Format

The API uses a standardized response format for all endpoints:

### 6.1 Success Response

```json
{
  "code": "SUCCESS_CODE",
  "message": "Success message",
  "data": {
    // Response data
  },
  "serverTime": 1617895234000
}
```

### 6.2 Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Error message",
  "serverTime": 1617895234000,
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

### 6.3 Error Codes

Common HTTP status codes and their corresponding error codes:
- 200 OK: SUCCESS
- 201 Created: SUCCESS (with specific code like USER_REGISTERED)
- 400 Bad Request: BAD_REQUEST
- 401 Unauthorized: UNAUTHORIZED
- 403 Forbidden: FORBIDDEN or PERMISSION_DENIED
- 404 Not Found: NOT_FOUND, BOOKMARK_NOT_FOUND, CATEGORY_NOT_FOUND, etc.
- 409 Conflict: CONFLICT, CATEGORY_NAME_CONFLICT, etc.
- 422 Unprocessable Entity: VALIDATION_ERROR
- 429 Too Many Requests: TOO_MANY_REQUESTS
- 500 Internal Server Error: INTERNAL_SERVER_ERROR

## 7. Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens are signed with a secure secret key
- Rate limiting is implemented to prevent brute force attacks
- Input validation is performed on all endpoints
- SQL injection protection through parameterized queries
- Authentication and authorization checks for all protected routes

### 7.1 Rate Limiting

The API implements rate limiting to protect against abuse:
- Authentication endpoints (register, login): 10 requests per 15 minutes
- Standard endpoints: 30 requests per minute

## 8. Deployment

The application is dockerized for easy deployment:
- Docker Compose setup for development environment
- PostgreSQL database in a separate container
- API server in its own container
- PgAdmin for database management (development only)

## 9. Potential Future Improvements

1. **Bookmark Preview Generation**:
   - Automatically generate previews for bookmarked websites
   - Extract metadata such as title, description, and favicon

2. **User Preferences**:
   - Allow users to set default view preferences
   - Enable theme customization

3. **Sharing Capabilities**:
   - Share bookmarks or collections with other users
   - Public/private bookmark settings

4. **Import/Export Functionality**:
   - Import bookmarks from browsers
   - Export bookmarks in standard formats

5. **Advanced Search**:
   - Full-text search capabilities
   - Search within bookmark content

6. **Analytics**:
   - Track bookmark usage and visits
   - Provide insights and recommendations

7. **API Rate Limiting Enhancement**:
   - Implement token bucket algorithm
   - Different rate limits for different endpoints

8. **Multi-factor Authentication**:
   - Add additional security layers

9. **WebSocket Support**:
   - Real-time updates for collaborative features

10. **Mobile-friendly API Optimizations**:
    - Minimize payload sizes
    - Implement efficient syncing mechanisms

## 10. Conclusion

The Bookmark Management API provides a robust foundation for building bookmark management applications. It follows RESTful principles and uses modern web technologies to deliver a secure and scalable solution. The standardized response format ensures consistency across all endpoints, making it easier for clients to consume the API.