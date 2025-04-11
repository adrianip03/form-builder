class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400);
    this.details = details;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, 500);
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  DatabaseError
}; 