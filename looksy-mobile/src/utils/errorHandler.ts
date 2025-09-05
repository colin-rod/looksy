import { Alert } from 'react-native';
import { AppError, ServiceResponse } from '../types';

// Error types
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Error messages
const ERROR_MESSAGES = {
  [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [ErrorCode.AUTHENTICATION_ERROR]: 'Authentication failed. Please log in again.',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid data provided.',
  [ErrorCode.ANALYSIS_ERROR]: 'Failed to analyze outfit. Please try again.',
  [ErrorCode.UPLOAD_ERROR]: 'Failed to upload image. Please try again.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

// Create standardized error
export const createError = (
  code: ErrorCode, 
  message?: string, 
  details?: any
): AppError => ({
  code,
  message: message || ERROR_MESSAGES[code],
  details,
});

// Handle and log errors consistently
export const handleError = (error: any, context?: string): AppError => {
  const errorMessage = error?.message || 'Unknown error';
  const errorCode = mapErrorToCode(error);
  
  // Log error for debugging
  console.error(`Error in ${context || 'Unknown context'}:`, {
    code: errorCode,
    message: errorMessage,
    details: error,
  });

  return createError(errorCode, errorMessage, error);
};

// Map common errors to error codes
const mapErrorToCode = (error: any): ErrorCode => {
  if (!error) return ErrorCode.UNKNOWN_ERROR;
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorCode.NETWORK_ERROR;
  }
  
  if (message.includes('auth') || error.status === 401) {
    return ErrorCode.AUTHENTICATION_ERROR;
  }
  
  if (message.includes('upload') || message.includes('file')) {
    return ErrorCode.UPLOAD_ERROR;
  }
  
  if (message.includes('analysis') || message.includes('openai')) {
    return ErrorCode.ANALYSIS_ERROR;
  }
  
  if (error.status >= 400 && error.status < 500) {
    return ErrorCode.VALIDATION_ERROR;
  }
  
  return ErrorCode.UNKNOWN_ERROR;
};

// Show user-friendly error alert
export const showErrorAlert = (error: AppError | string, title = 'Error') => {
  const message = typeof error === 'string' ? error : error.message;
  
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }]
  );
};

// Retry mechanism with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Async error boundary for React components
export const withErrorBoundary = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      throw appError;
    }
  };
};

// Service response wrapper
export const createServiceResponse = <T>(
  data?: T,
  error?: string | AppError
): ServiceResponse<T> => {
  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    return {
      success: false,
      error: errorMessage,
    };
  }
  
  return {
    success: true,
    data,
  };
};

// Validation helper
export const validateRequired = (value: any, fieldName: string) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw createError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} is required`
    );
  }
};

// Network error helper
export const isNetworkError = (error: any): boolean => {
  return error?.code === ErrorCode.NETWORK_ERROR ||
         error?.message?.includes('network') ||
         error?.message?.includes('fetch') ||
         !navigator?.onLine;
};