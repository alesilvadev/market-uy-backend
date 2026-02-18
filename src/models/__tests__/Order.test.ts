import { OrderModel } from '../Order';
import { ApiError } from '../../utils/errors';
import '../../__mocks__/firebase';
import { mockFirestore } from '../../__mocks__/firebase';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('OrderModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates order with draft status', async () => {
      mockFirestore.collection().doc().set.mockResolvedValueOnce(undefined);

      const order = await OrderModel.create();

      expect(order.status).toBe('draft');
      expect(order.items).toEqual([]);
      expect(order.wishlistItems).toEqual([]);
      expect(order.subtotal).toBe(0);
      expect(order.tax).toBe(0);
      expect(order.total).toBe(0);
    });

    it('creates order with clientId when provided', async () => {
      mockFirestore.collection().doc().set.mockResolvedValueOnce(undefined);

      const order = await OrderModel.create('client123');

      expect(order.clientId).toBe('client123');
    });

    it('generates unique ID', async () => {
      mockFirestore.collection().doc().set.mockResolvedValueOnce(undefined);

      const order = await OrderModel.create();

      expect(order.id).toBe('test-uuid-1234');
    });
  });

  describe('getById', () => {
    it('returns order when found', async () => {
      const mockOrderData = {
        id: 'order1',
        items: [],
        wishlistItems: [],
        status: 'draft',
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'order1',
        data: () => mockOrderData,
      });

      const result = await OrderModel.getById('order1');

      expect(result).toEqual(expect.objectContaining(mockOrderData));
    });

    it('returns null when order not found', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      const result = await OrderModel.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('handles Firestore Timestamp conversion', async () => {
      const mockDate = { toDate: () => new Date('2024-02-17') };
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'order1',
        data: () => ({
          items: [],
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
      });

      const result = await OrderModel.getById('order1');

      expect(result?.createdAt).toEqual(new Date('2024-02-17'));
    });
  });

  describe('update', () => {
    it('updates order with new data', async () => {
      const updatedOrderData = {
        id: 'order1',
        status: 'pending',
        items: [{ id: 'item1', code: 'PROD001', quantity: 2 }],
      };

      mockFirestore.collection().doc().update.mockResolvedValueOnce(undefined);
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'order1',
        data: () => updatedOrderData,
      });

      const result = await OrderModel.update('order1', { status: 'pending' });

      expect(result.status).toBe('pending');
      expect(mockFirestore.collection().doc().update).toHaveBeenCalled();
    });

    it('throws error if update fails', async () => {
      mockFirestore.collection().doc().update.mockResolvedValueOnce(undefined);
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      await expect(
        OrderModel.update('order1', { status: 'pending' })
      ).rejects.toThrow('Failed to update order');
    });
  });

  describe('delete', () => {
    it('deletes order from database', async () => {
      mockFirestore.collection().doc().delete.mockResolvedValueOnce(undefined);

      await OrderModel.delete('order1');

      expect(mockFirestore.collection).toHaveBeenCalledWith('orders');
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith('order1');
    });
  });
});
