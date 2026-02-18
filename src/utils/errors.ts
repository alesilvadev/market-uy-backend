export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (error: any) => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  if (error.details && error.details.length > 0) {
    const joiError = error.details[0];
    return {
      statusCode: 400,
      message: joiError.message,
      code: 'VALIDATION_ERROR',
    };
  }

  return {
    statusCode: 500,
    message: 'Internal server error',
  };
};
