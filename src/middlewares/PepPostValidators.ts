import { body } from 'express-validator';

export const createPostValidationRules = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 1000 })
    .withMessage('Content cannot exceed 1000 characters'),
  body('mediaUrls')
    .optional()
    .isArray({ max: 4 })
    .withMessage('MediaUrls must be an array with a maximum of 4 items')
    .custom((value: string[]) => {
      if (!value.every((url) => typeof url === 'string')) {
        throw new Error('MediaUrls must be an array of strings');
      }
      return true;
    }),
];

export const reactToPostValidationRules = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['like', 'love', 'sad', 'mad'])
    .withMessage('Type must be either like, love, sad, or mad'),
]
