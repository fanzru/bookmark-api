// src/middlewares/response.middleware.ts
import { Context, MiddlewareHandler } from 'hono';
import { StatusCode } from 'hono/utils/http-status';

export interface StandardResponse<T = any> {
  code: string;
  message: string;
  data?: T;
  serverTime: number;
  error?: {
    message: string;
    details?: any[];
  };
}

export const standardizeResponse: MiddlewareHandler = async (c, next) => {
  // Save the original response handlers
  await next();

  // Get the response
  const res = c.res;
  
  // Skip if not a JSON response or already processed
  if (!res || res.headers.get('content-type') !== 'application/json') {
    return;
  }

  try {
    // Get original response data
    const originalBody = await res.json();
    const status = res.status;

    // Create standardized response
    let standardizedBody: StandardResponse;

    // If it's an error response
    if (status >= 400) {
      const errorCode = getErrorCodeFromStatus(status);
      
      if (originalBody.error) {
        standardizedBody = {
          code: errorCode,
          message: originalBody.error.message || 'An error occurred',
          serverTime: Date.now(),
          error: originalBody.error
        };
      } else {
        standardizedBody = {
          code: errorCode,
          message: originalBody.message || 'An error occurred',
          serverTime: Date.now(),
          error: {
            message: originalBody.message || 'An error occurred',
            details: originalBody.details
          }
        };
      }
    } else {
      // For success responses
      standardizedBody = {
        code: 'SUCCESS',
        message: originalBody.message || 'Success',
        data: originalBody,
        serverTime: Date.now()
      };
    }

    // Replace response with standardized one
    c.res = new Response(JSON.stringify(standardizedBody), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    // If there's an error parsing the response, leave it as is
    console.error('Error standardizing response:', e);
  }
};

// Helper to map HTTP status codes to error codes
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    default:
      return 'ERROR';
  }
}