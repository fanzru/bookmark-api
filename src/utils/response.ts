import { Context } from 'hono';
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

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message: string = 'Success',
  code: string = 'SUCCESS',
  status: number = 200
) => {
  const response: StandardResponse<T> = {
    code,
    message,
    data,
    serverTime: Date.now()
  };
  
  return c.json(response, status as any);
};

export const sendError = (
  c: Context,
  message: string,
  details?: any[],
  status: number = 500,
  code?: string
) => {
  const errorCode = code || getErrorCodeFromStatus(status);
  
  const response: StandardResponse = {
    code: errorCode,
    message,
    serverTime: Date.now(),
    error: {
      message,
      ...(details && { details })
    }
  };
  
  return c.json(response, status as any);
};

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