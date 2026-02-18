import { ApiError, errorHandler } from '../errors';

describe('Error Handling', () => {
  describe('ApiError class', () => {
    it('creates error with all properties', () => {
      const error = new ApiError(400, 'Bad request', 'VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ApiError');
    });

    it('creates error without code', () => {
      const error = new ApiError(500, 'Server error');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
      expect(error.code).toBeUndefined();
    });
  });

  describe('errorHandler function', () => {
    it('handles ApiError correctly', () => {
      const error = new ApiError(404, 'Not found', 'NOT_FOUND');
      const result = errorHandler(error);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Not found');
      expect(result.code).toBe('NOT_FOUND');
    });

    it('handles Joi validation errors', () => {
      const joiError = {
        details: [
          {
            message: '"code" is required',
          },
        ],
      };
      const result = errorHandler(joiError);
      expect(result.statusCode).toBe(400);
      expect(result.message).toContain('code');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('handles generic errors', () => {
      const error = new Error('Unknown error');
      const result = errorHandler(error);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Internal server error');
    });

    it('handles null errors', () => {
      const error = { message: 'Some error' };
      const result = errorHandler(error);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Internal server error');
    });
  });
});
