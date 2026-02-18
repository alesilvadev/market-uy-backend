import {
  productSearchSchema,
  addToOrderSchema,
  updateOrderItemSchema,
  moveItemSchema,
  closeOrderSchema,
  cashierLoginSchema,
  validateRequest,
} from '../validation';

describe('Validation Schemas', () => {
  describe('productSearchSchema', () => {
    it('validates valid product code', () => {
      const result = productSearchSchema.validate({ code: 'PROD123' });
      expect(result.error).toBeUndefined();
      expect(result.value.code).toBe('PROD123');
    });

    it('rejects empty code', () => {
      const result = productSearchSchema.validate({ code: '' });
      expect(result.error).toBeDefined();
    });

    it('rejects missing code', () => {
      const result = productSearchSchema.validate({});
      expect(result.error).toBeDefined();
    });

    it('rejects code longer than 50 chars', () => {
      const result = productSearchSchema.validate({ code: 'A'.repeat(51) });
      expect(result.error).toBeDefined();
    });
  });

  describe('addToOrderSchema', () => {
    it('validates all valid fields', () => {
      const data = { code: 'PROD123', quantity: 5, color: 'red' };
      const result = addToOrderSchema.validate(data);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(data);
    });

    it('validates without optional color', () => {
      const data = { code: 'PROD123', quantity: 5 };
      const result = addToOrderSchema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('rejects quantity of 0', () => {
      const result = addToOrderSchema.validate({ code: 'PROD123', quantity: 0 });
      expect(result.error).toBeDefined();
    });

    it('rejects quantity > 10000', () => {
      const result = addToOrderSchema.validate({ code: 'PROD123', quantity: 10001 });
      expect(result.error).toBeDefined();
    });

    it('rejects non-integer quantity', () => {
      const result = addToOrderSchema.validate({ code: 'PROD123', quantity: 5.5 });
      expect(result.error).toBeDefined();
    });
  });

  describe('updateOrderItemSchema', () => {
    it('validates with itemId and quantity', () => {
      const result = updateOrderItemSchema.validate({ itemId: 'item123', quantity: 3 });
      expect(result.error).toBeUndefined();
    });

    it('validates with only itemId', () => {
      const result = updateOrderItemSchema.validate({ itemId: 'item123' });
      expect(result.error).toBeUndefined();
    });

    it('allows quantity of 0 (for removal)', () => {
      const result = updateOrderItemSchema.validate({ itemId: 'item123', quantity: 0 });
      expect(result.error).toBeUndefined();
    });

    it('rejects negative quantity', () => {
      const result = updateOrderItemSchema.validate({ itemId: 'item123', quantity: -1 });
      expect(result.error).toBeDefined();
    });
  });

  describe('moveItemSchema', () => {
    it('validates move from items to wishlistItems', () => {
      const result = moveItemSchema.validate({
        itemId: 'item123',
        from: 'items',
        to: 'wishlistItems',
      });
      expect(result.error).toBeUndefined();
    });

    it('validates move from wishlistItems to items', () => {
      const result = moveItemSchema.validate({
        itemId: 'item123',
        from: 'wishlistItems',
        to: 'items',
      });
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid from value', () => {
      const result = moveItemSchema.validate({
        itemId: 'item123',
        from: 'invalid',
        to: 'items',
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('closeOrderSchema', () => {
    it('validates with payment method and notes', () => {
      const data = { paymentMethod: 'cash', notes: 'Express order' };
      const result = closeOrderSchema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('validates with no optional fields', () => {
      const result = closeOrderSchema.validate({});
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid payment method', () => {
      const result = closeOrderSchema.validate({ paymentMethod: 'bitcoin' });
      expect(result.error).toBeDefined();
    });
  });

  describe('cashierLoginSchema', () => {
    it('validates valid email and password', () => {
      const data = { email: 'cashier@example.com', password: 'password123' };
      const result = cashierLoginSchema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid email format', () => {
      const result = cashierLoginSchema.validate({ email: 'invalid-email', password: 'password123' });
      expect(result.error).toBeDefined();
    });

    it('rejects short password', () => {
      const result = cashierLoginSchema.validate({ email: 'cashier@example.com', password: 'pass' });
      expect(result.error).toBeDefined();
    });

    it('rejects missing password', () => {
      const result = cashierLoginSchema.validate({ email: 'cashier@example.com' });
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRequest function', () => {
    it('returns validated value on success', () => {
      const data = { code: 'PROD123' };
      const result = validateRequest(productSearchSchema, data);
      expect(result.code).toBe('PROD123');
    });

    it('throws error on validation failure', () => {
      expect(() => {
        validateRequest(productSearchSchema, { code: '' });
      }).toThrow();
    });
  });
});
