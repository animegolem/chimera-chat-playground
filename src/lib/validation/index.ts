/**
 * Validation module entry point
 * Exports all schemas and validation utilities
 */

// Re-export all schemas
export * from './schemas/api';
export * from './schemas/messages';
export * from './schemas/models';
export * from './schemas/storage';

// Common validation error handler
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
