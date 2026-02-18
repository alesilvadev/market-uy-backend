import { Router, Request, Response } from 'express';
import { getFirestoreDb } from '../utils/firebase';
import { validateRequest, createCashierSchema, batchImportProductsSchema } from '../utils/validation';
import { authenticateToken, AuthenticatedRequest, authorizeRole } from '../middleware/auth';
import { errorHandler } from '../utils/errors';
import { ProductService } from '../services/ProductService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/cashiers', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role } = validateRequest(createCashierSchema, req.body);
    const db = getFirestoreDb();

    const snapshot = await db
      .collection('cashiers')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email already registered' },
      });
    }

    const cashierData = {
      email: email.toLowerCase().trim(),
      passwordHash: password,
      name,
      role: role || 'cashier',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const doc = await db.collection('cashiers').add(cashierData);

    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        email: cashierData.email,
        name: cashierData.name,
        role: cashierData.role,
      },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.get('/cashiers', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection('cashiers').get();

    const cashiers = snapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      role: doc.data().role,
      createdAt: doc.data().createdAt,
    }));

    res.json({
      success: true,
      data: cashiers,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.delete('/cashiers/:cashierId', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cashierId } = req.params;
    const db = getFirestoreDb();

    await db.collection('cashiers').doc(cashierId).delete();

    res.json({
      success: true,
      data: { message: 'Cashier deleted' },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.post('/products/batch-import', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { products } = validateRequest(batchImportProductsSchema, req.body);

    const ids = await ProductService.batchImport(products);

    res.status(201).json({
      success: true,
      data: {
        count: ids.length,
        ids,
      },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.post('/products', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productData = req.body;

    const product = await ProductService.createOrUpdate(productData);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }
});

router.get('/orders', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();
    const status = (req.query.status as string) || 'all';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let query: any = db.collection('orders').orderBy('createdAt', 'desc');

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(limit + 1).offset(offset).get();

    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    res.json({
      success: true,
      data: orders,
      pagination: { limit, offset },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.get('/orders/stats', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();

    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map((doc) => doc.data());

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      ordersByStatus: {
        draft: orders.filter((o) => o.status === 'draft').length,
        pending: orders.filter((o) => o.status === 'pending').length,
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        paid: orders.filter((o) => o.status === 'paid').length,
        ready: orders.filter((o) => o.status === 'ready').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.get('/products', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const snapshot = await db
      .collection('products')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: products,
      pagination: { limit, offset },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.get('/products/count', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection('products').count().get();

    res.json({
      success: true,
      data: {
        totalProducts: snapshot.data().count,
      },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.delete('/products/:productId', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const db = getFirestoreDb();

    await db.collection('products').doc(productId).delete();

    res.json({
      success: true,
      data: { message: 'Product deleted' },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.put('/products/:productId', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const db = getFirestoreDb();

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    await db.collection('products').doc(productId).update(updateData);

    const updated = await db.collection('products').doc(productId).get();

    res.json({
      success: true,
      data: {
        id: productId,
        ...updated.data(),
      },
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

router.get('/dashboard', authenticateToken, authorizeRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getFirestoreDb();

    const [ordersSnapshot, productsSnapshot, cashiersSnapshot] = await Promise.all([
      db.collection('orders').get(),
      db.collection('products').get(),
      db.collection('cashiers').get(),
    ]);

    const orders = ordersSnapshot.docs.map((doc) => doc.data());

    const dashboard = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalProducts: productsSnapshot.size,
      totalCashiers: cashiersSnapshot.size,
      recentOrders: orders.slice(0, 5),
      ordersByStatus: {
        draft: orders.filter((o) => o.status === 'draft').length,
        pending: orders.filter((o) => o.status === 'pending').length,
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        paid: orders.filter((o) => o.status === 'paid').length,
        ready: orders.filter((o) => o.status === 'ready').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
      },
    };

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    const err = errorHandler(error);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }
});

export default router;
