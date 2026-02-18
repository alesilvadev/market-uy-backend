import { Router, Request, Response } from 'express';
import { getFirestoreDb } from '../utils/firebase';
import { validateRequest, cashierLoginSchema } from '../utils/validation';
import { authenticateToken, AuthenticatedRequest, authorizeRole } from '../middleware/auth';
import { errorHandler } from '../utils/errors';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = validateRequest(cashierLoginSchema, req.body);
    const db = getFirestoreDb();

    const snapshot = await db
      .collection('cashiers')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty || snapshot.docs[0].data().passwordHash !== password) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const doc = snapshot.docs[0];
    const cashier = doc.data();

    const token = Buffer.from(
      JSON.stringify({
        id: doc.id,
        email: cashier.email,
        role: cashier.role,
      })
    ).toString('base64');

    res.json({
      success: true,
      data: {
        token: `Bearer ${token}`,
        user: {
          id: doc.id,
          email: cashier.email,
          name: cashier.name,
          role: cashier.role,
        },
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

router.get('/orders/:orderId', authenticateToken, authorizeRole(['cashier', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getFirestoreDb();

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const data = doc.data();
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
    };

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

router.post('/orders/:orderId/verify', authenticateToken, authorizeRole(['cashier', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getFirestoreDb();

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = doc.data();
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'Order is not in pending status' },
      });
    }

    order.status = 'confirmed';
    order.updatedAt = new Date();

    await db.collection('orders').doc(orderId).update(order);

    res.json({
      success: true,
      data: {
        orderId,
        status: 'confirmed',
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

router.post('/orders/:orderId/mark-paid', authenticateToken, authorizeRole(['cashier', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getFirestoreDb();

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = doc.data();
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    order.status = 'paid';
    order.paymentStatus = 'completed';
    order.updatedAt = new Date();

    await db.collection('orders').doc(orderId).update(order);

    res.json({
      success: true,
      data: {
        orderId,
        status: 'paid',
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

router.post('/orders/:orderId/ready', authenticateToken, authorizeRole(['cashier', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getFirestoreDb();

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = doc.data();
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    order.status = 'ready';
    order.updatedAt = new Date();

    await db.collection('orders').doc(orderId).update(order);

    res.json({
      success: true,
      data: {
        orderId,
        status: 'ready',
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

router.post('/orders/:orderId/deliver', authenticateToken, authorizeRole(['cashier', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getFirestoreDb();

    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    const order = doc.data();
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      });
    }

    order.status = 'delivered';
    order.completedAt = new Date();
    order.updatedAt = new Date();

    await db.collection('orders').doc(orderId).update(order);

    res.json({
      success: true,
      data: {
        orderId,
        status: 'delivered',
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

export default router;
