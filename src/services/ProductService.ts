import { getFirestoreDb } from '../utils/firebase';
import { Product } from '../types';
import { ApiError } from '../utils/errors';

export class ProductService {
  static async searchByCode(code: string): Promise<Product | null> {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection('products')
      .where('code', '==', code.toUpperCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  }

  static async getById(productId: string): Promise<Product | null> {
    const db = getFirestoreDb();
    const doc = await db.collection('products').doc(productId).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as Product;
  }

  static async getAll(limit: number = 100, offset: number = 0): Promise<Product[]> {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection('products')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
  }

  static async validateStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.getById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (!product.inStock) {
      throw new ApiError(400, 'Product is out of stock');
    }

    if (product.quantity < quantity) {
      throw new ApiError(400, 'Insufficient stock');
    }

    return true;
  }

  static async batchImport(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const db = getFirestoreDb();
    const batch = db.batch();
    const ids: string[] = [];
    const now = new Date();

    for (const product of products) {
      const docRef = db.collection('products').doc();
      batch.set(docRef, {
        ...product,
        code: product.code.toUpperCase().trim(),
        createdAt: now,
        updatedAt: now,
      });
      ids.push(docRef.id);
    }

    await batch.commit();
    return ids;
  }

  static async createOrUpdate(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const db = getFirestoreDb();
    const now = new Date();

    const existingProduct = await this.searchByCode(product.code);

    if (existingProduct) {
      const updateData = {
        ...product,
        code: product.code.toUpperCase().trim(),
        updatedAt: now,
      };
      await db.collection('products').doc(existingProduct.id).update(updateData);
      return { id: existingProduct.id, ...updateData, createdAt: existingProduct.createdAt, updatedAt: now } as Product;
    }

    const docRef = db.collection('products').doc();
    const newData = {
      ...product,
      code: product.code.toUpperCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(newData);
    return { id: docRef.id, ...newData } as Product;
  }
}
