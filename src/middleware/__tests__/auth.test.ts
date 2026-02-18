import { Request, Response, NextFunction } from 'express';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../auth';

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    let req: AuthenticatedRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        headers: {},
      } as AuthenticatedRequest;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      next = jest.fn();
    });

    it('calls next when token is valid', () => {
      const userData = { id: 'cashier1', email: 'test@example.com', role: 'cashier' };
      const token = Buffer.from(JSON.stringify(userData)).toString('base64');
      req.headers.authorization = `Bearer header.${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(userData);
      expect(req.token).toBeDefined();
    });

    it('returns 401 when token is missing', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', () => {
      req.headers.authorization = 'Bearer X.invalid-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('extracts token correctly from Bearer format', () => {
      const userData = { id: 'cashier1', email: 'test@example.com', role: 'admin' };
      const token = Buffer.from(JSON.stringify(userData)).toString('base64');
      req.headers.authorization = `Bearer some-header.${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toEqual(userData);
    });
  });

  describe('authorizeRole', () => {
    let req: AuthenticatedRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        user: { id: 'cashier1', email: 'test@example.com', role: 'cashier' },
      } as AuthenticatedRequest;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      next = jest.fn();
    });

    it('calls next when user role is allowed', () => {
      const middleware = authorizeRole(['cashier', 'admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 403 when user role is not allowed', () => {
      const middleware = authorizeRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user is missing', () => {
      req.user = undefined;
      const middleware = authorizeRole(['cashier']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows multiple roles', () => {
      const middleware = authorizeRole(['user', 'cashier', 'admin']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
