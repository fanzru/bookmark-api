export class ApiError extends Error {
    statusCode: number;
    errors?: any;
  
    constructor(statusCode: number, message: string, errors?: any) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  
    static badRequest(message: string = 'Bad Request', errors?: any) {
      return new ApiError(400, message, errors);
    }
  
    static unauthorized(message: string = 'Unauthorized', errors?: any) {
      return new ApiError(401, message, errors);
    }
  
    static forbidden(message: string = 'Forbidden', errors?: any) {
      return new ApiError(403, message, errors);
    }
  
    static notFound(message: string = 'Not Found', errors?: any) {
      return new ApiError(404, message, errors);
    }
  
    static conflict(message: string = 'Conflict', errors?: any) {
      return new ApiError(409, message, errors);
    }
  
    static internalServer(message: string = 'Internal Server Error', errors?: any) {
      return new ApiError(500, message, errors);
    }
  }
  
  // Custom error handler for validation errors
  export class ValidationError extends ApiError {
    constructor(errors: any) {
      super(400, 'Validation Error', errors);
      Object.setPrototypeOf(this, ValidationError.prototype);
    }
  }