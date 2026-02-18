import { ProductService } from '../ProductService';
import { ApiError } from '../../utils/errors';
import '../../__mocks__/firebase';
import { mockFirestore, mockGetFirestoreDb } from '../../__mocks__/firebase';

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchByCode', () => {
    it('returns product when found', async () => {
      const mockProduct = {
        id: 'prod1',
        code: 'PROD001',
        name: 'Test Product',
        price: 100,
        inStock: true,
      };

      const mockDoc = {
        id: 'prod1',
        data: () => ({ code: 'PROD001', name: 'Test Product', price: 100, inStock: true }),
      };

      mockFirestore.collection().where().limit().get.mockResolvedValueOnce({
        empty: false,
        docs: [mockDoc],
      });

      const result = await ProductService.searchByCode('prod001');

      expect(result).toEqual(mockProduct);
      expect(mockFirestore.collection).toHaveBeenCalledWith('products');
    });

    it('returns null when product not found', async () => {
      mockFirestore.collection().where().limit().get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const result = await ProductService.searchByCode('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('converts code to uppercase and trims', async () => {
      mockFirestore.collection().where().limit().get.mockResolvedValueOnce({
        empty: true,
      });

      await ProductService.searchByCode('  prod001  ');

      expect(mockFirestore.collection().where).toHaveBeenCalledWith('code', '==', 'PROD001');
    });
  });

  describe('getById', () => {
    it('returns product when found', async () => {
      const mockProduct = {
        code: 'PROD001',
        name: 'Test Product',
        price: 100,
      };

      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'prod1',
        data: () => mockProduct,
      });

      const result = await ProductService.getById('prod1');

      expect(result).toEqual({ id: 'prod1', ...mockProduct });
    });

    it('returns null when product not found', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      const result = await ProductService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('validateStock', () => {
    it('returns true when stock is sufficient', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'prod1',
        data: () => ({
          code: 'PROD001',
          name: 'Test Product',
          inStock: true,
          quantity: 10,
        }),
      });

      const result = await ProductService.validateStock('prod1', 5);

      expect(result).toBe(true);
    });

    it('throws error when product not found', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: false,
      });

      await expect(ProductService.validateStock('nonexistent', 5)).rejects.toThrow(
        'Product not found'
      );
    });

    it('throws error when product is out of stock', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'prod1',
        data: () => ({
          code: 'PROD001',
          name: 'Test Product',
          inStock: false,
          quantity: 0,
        }),
      });

      await expect(ProductService.validateStock('prod1', 5)).rejects.toThrow(
        'Product is out of stock'
      );
    });

    it('throws error when stock is insufficient', async () => {
      mockFirestore.collection().doc().get.mockResolvedValueOnce({
        exists: true,
        id: 'prod1',
        data: () => ({
          code: 'PROD001',
          name: 'Test Product',
          inStock: true,
          quantity: 3,
        }),
      });

      await expect(ProductService.validateStock('prod1', 5)).rejects.toThrow(
        'Insufficient stock'
      );
    });
  });

  describe('createOrUpdate', () => {
    it('creates new product when code does not exist', async () => {
      mockFirestore.collection().where().limit().get.mockResolvedValueOnce({
        empty: true,
      });

      const docRefMock = { id: 'newprod1' };
      mockFirestore.collection().doc.mockReturnValueOnce(docRefMock as any);
      mockFirestore.collection().doc().set.mockResolvedValueOnce(undefined);

      const newProduct = {
        code: 'newprod',
        name: 'New Product',
        description: 'A new product',
        price: 50,
        inStock: true,
        quantity: 10,
      };

      const result = await ProductService.createOrUpdate(newProduct);

      expect(result.code).toBe('NEWPROD');
      expect(result.name).toBe('New Product');
    });
  });
});
