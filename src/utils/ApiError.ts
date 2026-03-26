export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public field?: string;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    field?: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.isOperational = isOperational;
    
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static validationError(message: string, field?: string): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, field);
  }

  static emailAlreadyExists(): ApiError {
    return new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'Email already registered', 'email');
  }

  static otpExpired(): ApiError {
    return new ApiError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one');
  }

  static otpInvalid(): ApiError {
    return new ApiError(400, 'OTP_INVALID', 'Invalid OTP. Please check and try again');
  }

  static otpAttemptsExceeded(): ApiError {
    return new ApiError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Maximum OTP attempts exceeded. Please request a new OTP');
  }

  static userNotFound(): ApiError {
    return new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static internalError(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }
}
