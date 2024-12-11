import { body } from 'express-validator';

export const createCommentValidationRules = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 500 })
    .withMessage('Content cannot exceed 500 characters'),

];

