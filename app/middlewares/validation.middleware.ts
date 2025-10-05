import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse } from '../dtos/response/api.response.dto';

/**
 * Validation error handler
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    return res.status(400).json(ApiResponse.validationError(formattedErrors));
  }

  next();
};

/**
 * Common validation rules
 */
export const commonValidations = {
  // UUID validation
  uuid: param('id').isUUID().withMessage('ID phải là UUID hợp lệ'),

  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email không được vượt quá 255 ký tự'),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Mật khẩu phải có từ 8-128 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
    ),

  // Phone validation
  phone: body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Số điện thoại không hợp lệ'),

  // OTP validation
  otp: body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP phải có đúng 6 chữ số')
    .isNumeric()
    .withMessage('OTP chỉ được chứa số'),

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Trang phải là số nguyên dương'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit phải từ 1-100'),
  ],

  // Search validation
  search: query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải từ 1-100 ký tự')
    .escape(), // Escape HTML entities
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Sanitize string fields
  const sanitizeString = (str: string): string => {
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  function sanitizeObject(obj: any): void {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  }

  next();
};
