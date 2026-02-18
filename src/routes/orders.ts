import { Router, Request, Response } from 'express';
import { OrderModel } from '../models/Order';
import { ProductService } from '../services/ProductService';
import {
  validateRequest,
  addToOrderSchema,
  updateOrderItemSchema,
  moveItemSchema,
  closeOrderSchema,
} from '../utils/validation';
import { errorHandler } from '../utils/errors';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.body;
    const order = await OrderModel.create(clientId);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.getById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.post('/:orderId/items', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { code, quantity, color } = validateRequest(addToOrderSchema, req.body);

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add items to a closed order' },
      });
    }

    const product = await ProductService.searchByCode(code);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
    }

    await ProductService.validateStock(product.id, quantity);

    const existingItem = order.items.find((item) => item.code === code && item.color === color);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
      order.items.push({
        id: Math.random().toString(36).substring(7),
        code: product.code,
        name: product.name,
        price: product.price,
        quantity,
        color: color || undefined,
        image: product.image || undefined,
        subtotal: product.price * quantity,
      });
    }

    order.subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    order.tax = order.subtotal * 0.1;
    order.total = order.subtotal + order.tax;
    order.updatedAt = new Date();

    const updated = await OrderModel.update(orderId, order);

    res.status(201).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.put('/:orderId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity, color } = validateRequest(updateOrderItemSchema, req.body);

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Item not found' },
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        order.items = order.items.filter((i) => i.id !== itemId);
      } else {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
      }
    }

    if (color !== undefined) {
      item.color = color;
    }

    order.subtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
    order.tax = order.subtotal * 0.1;
    order.total = order.subtotal + order.tax;
    order.updatedAt = new Date();

    const updated = await OrderModel.update(orderId, order);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.delete('/:orderId/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    order.items = order.items.filter((i) => i.id !== itemId);
    order.subtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
    order.tax = order.subtotal * 0.1;
    order.total = order.subtotal + order.tax;
    order.updatedAt = new Date();

    const updated = await OrderModel.update(orderId, order);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.post('/:orderId/wishlist', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { code, quantity, color } = validateRequest(addToOrderSchema, req.body);

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const product = await ProductService.searchByCode(code);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
    }

    const existingItem = order.wishlistItems.find((item) => item.code === code && item.color === color);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
      order.wishlistItems.push({
        id: Math.random().toString(36).substring(7),
        code: product.code,
        name: product.name,
        price: product.price,
        quantity,
        color: color || undefined,
        image: product.image || undefined,
        subtotal: product.price * quantity,
      });
    }

    order.updatedAt = new Date();
    const updated = await OrderModel.update(orderId, order);

    res.status(201).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.post('/:orderId/move-item', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { itemId, from, to } = validateRequest(moveItemSchema, req.body);

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const item = order[from as 'items' | 'wishlistItems'].find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Item not found' },
      });
    }

    order[from as 'items' | 'wishlistItems'] = order[from as 'items' | 'wishlistItems'].filter(
      (i) => i.id !== itemId
    );
    order[to as 'items' | 'wishlistItems'].push(item);

    if (from === 'items') {
      order.subtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
      order.tax = order.subtotal * 0.1;
      order.total = order.subtotal + order.tax;
    }

    order.updatedAt = new Date();
    const updated = await OrderModel.update(orderId, order);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.post('/:orderId/close', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, notes } = validateRequest(closeOrderSchema, req.body);

    const order = await OrderModel.getById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    if (order.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot close an empty order' },
      });
    }

    order.status = 'pending';
    order.paymentMethod = (paymentMethod as any) || 'cash';
    order.notes = notes;
    order.updatedAt = new Date();

    const updated = await OrderModel.update(orderId, order);

    res.json({
      success: true,
      data: { orderId: updated.id },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

export default router;
