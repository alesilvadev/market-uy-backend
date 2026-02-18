import { getFirestoreDb } from '../utils/firebase';
import { Order, OrderItem } from '../types';
import { ApiError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { ProductService } from '../services/ProductService';

export class OrderModel {
  static async create(clientId?: string): Promise<Order> {
    const db = getFirestoreDb();
    const now = new Date();
    const order: Order = {
      id: uuidv4(),
      clientId,
      items: [],
      wishlistItems: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('orders').doc(order.id).set(order);
    return order;
  }

  static async getById(orderId: string): Promise<Order | null> {
    const db = getFirestoreDb();
    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
    } as Order;
  }

  static async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    const db = getFirestoreDb();
    const now = new Date();

    const updateData = {
      ...updates,
      updatedAt: now,
    };

    await db.collection('orders').doc(orderId).update(updateData);

    const updated = await this.getById(orderId);
    if (!updated) {
      throw new ApiError(500, 'Failed to update order');
    }

    return updated;
  }

  static async delete(orderId: string): Promise<void> {
    const db = getFirestoreDb();
    await db.collection('orders').doc(orderId).delete();
  }
}
