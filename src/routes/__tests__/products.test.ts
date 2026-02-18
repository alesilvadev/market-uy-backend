import request from 'supertest';
import express from 'express';
import productRoutes from '../products';
import { ProductService } from '../../services/ProductService';
import '../../__mocks__/firebase';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

jest.mock('../../services/ProductService');
const MockProductService = ProductService as jest.Mocked<typeof ProductService>;

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/products/search', () => {
    it('returns product when found', async () => {
      const mockProduct = {
        id: 'prod1',
        code: 'PROD001',
        name: 'Test Product',
        description: 'Test',
        price: 100,
        inStock: true,
        quantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockProductService.searchByCode.mockResolvedValueOnce(mockProduct as any);

      const response = await request(app)
        .post('/api/products/search')
        .send({ code: 'PROD001' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProduct);
    });

    it('returns 404 when product not found', async () => {
      MockProductService.searchByCode.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/products/search')
        .send({ code: 'NONEXISTENT' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Product not found');
    });

    it('returns 400 for invalid request', async () => {
      const response = await request(app)
        .post('/api/products/search')
        .send({ code: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 for missing code', async () => {
      const response = await request(app)
        .post('/api/products/search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products/:id', () => {
    it('returns product by id', async () => {
      const mockProduct = {
        id: 'prod1',
        code: 'PROD001',
        name: 'Test Product',
        description: 'Test',
        price: 100,
        inStock: true,
        quantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockProductService.getById.mockResolvedValueOnce(mockProduct as any);

      const response = await request(app)
        .get('/api/products/prod1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProduct);
    });

    it('returns 404 when product not found', async () => {
      MockProductService.getById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/products/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
