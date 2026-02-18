import request from 'supertest';
import express from 'express';
import orderRoutes from '../orders';
import { OrderModel } from '../../models/Order';
import { ProductService } from '../../services/ProductService';
import '../../__mocks__/firebase';

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

jest.mock('../../models/Order');
jest.mock('../../services/ProductService');
jest.mock('uuid', () => ({ v4: () => 'item-uuid-123' }));

const MockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;
const MockProductService = ProductService as jest.Mocked<typeof ProductService>;

describe('Order Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('creates order successfully', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'draft',
        items: [],
        wishlistItems: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };

      MockOrderModel.create.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/orders')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order1');
    });

    it('creates order with clientId', async () => {
      const mockOrder = {
        id: 'order1',
        clientId: 'client123',
        status: 'draft',
      };

      MockOrderModel.create.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/orders')
        .send({ clientId: 'client123' });

      expect(MockOrderModel.create).toHaveBeenCalledWith('client123');
      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('returns order details', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'draft',
        items: [],
        subtotal: 0,
      };

      MockOrderModel.getById.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .get('/api/orders/order1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order1');
    });

    it('returns 404 when order not found', async () => {
      MockOrderModel.getById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/orders/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/orders/:orderId/items', () => {
    it('adds item to order', async () => {
      const mockProduct = {
        id: 'prod1',
        code: 'PROD001',
        name: 'Test Product',
        price: 100,
      };

      const mockOrder = {
        id: 'order1',
        status: 'draft',
        items: [{ id: 'item1', code: 'PROD001', name: 'Test Product', price: 100, quantity: 2, subtotal: 200 }],
        subtotal: 200,
        tax: 20,
        total: 220,
      };

      MockOrderModel.getById.mockResolvedValueOnce(mockOrder as any);
      MockProductService.searchByCode.mockResolvedValueOnce(mockProduct as any);
      MockProductService.validateStock.mockResolvedValueOnce(true);
      MockOrderModel.update.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/orders/order1/items')
        .send({ code: 'PROD001', quantity: 2 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(MockProductService.searchByCode).toHaveBeenCalledWith('PROD001');
    });

    it('returns 404 when order not found', async () => {
      MockOrderModel.getById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/orders/nonexistent/items')
        .send({ code: 'PROD001', quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Order not found');
    });

    it('returns 400 when adding to closed order', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'pending',
        items: [],
      };

      MockOrderModel.getById.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/orders/order1/items')
        .send({ code: 'PROD001', quantity: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Cannot add items');
    });

    it('returns 400 for invalid quantity', async () => {
      const response = await request(app)
        .post('/api/orders/order1/items')
        .send({ code: 'PROD001', quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/orders/:orderId/close', () => {
    it('closes order successfully', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'draft',
        items: [{ id: 'item1', subtotal: 100 }],
        updatedAt: new Date(),
      };

      const closedOrder = {
        id: 'order1',
        status: 'pending',
        items: mockOrder.items,
      };

      MockOrderModel.getById.mockResolvedValueOnce(mockOrder as any);
      MockOrderModel.update.mockResolvedValueOnce(closedOrder as any);

      const response = await request(app)
        .post('/api/orders/order1/close')
        .send({ paymentMethod: 'cash' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBe('order1');
    });

    it('returns 400 when closing empty order', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'draft',
        items: [],
      };

      MockOrderModel.getById.mockResolvedValueOnce(mockOrder as any);

      const response = await request(app)
        .post('/api/orders/order1/close')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Cannot close an empty order');
    });
  });
});
