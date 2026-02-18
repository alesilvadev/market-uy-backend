import { Router, Request, Response } from 'express';
import { getFirestoreDb } from '../utils/firebase';
import { validateRequest, clientRegisterSchema, clientLoginSchema } from '../utils/validation';
import { errorHandler } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, phone } = validateRequest(clientRegisterSchema, req.body);
    const db = getFirestoreDb();

    let existingClient = null;
    if (email) {
      const emailSnapshot = await db
        .collection('clients')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      existingClient = emailSnapshot.empty ? null : emailSnapshot.docs[0];
    }

    if (phone && !existingClient) {
      const phoneSnapshot = await db
        .collection('clients')
        .where('phone', '==', phone.trim())
        .limit(1)
        .get();
      existingClient = phoneSnapshot.empty ? null : phoneSnapshot.docs[0];
    }

    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: { message: 'Client already registered' },
      });
    }

    const clientId = uuidv4();
    const clientData = {
      id: clientId,
      email: email ? email.toLowerCase().trim() : null,
      phone: phone ? phone.trim() : null,
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('clients').doc(clientId).set(clientData);

    const token = Buffer.from(JSON.stringify({ clientId, type: 'client' })).toString('base64');

    res.status(201).json({
      success: true,
      data: {
        clientId,
        token: `Bearer ${token}`,
        email: clientData.email,
        phone: clientData.phone,
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

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, phone } = validateRequest(clientLoginSchema, req.body);
    const db = getFirestoreDb();

    let clientDoc = null;

    if (email) {
      const snapshot = await db
        .collection('clients')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get();
      clientDoc = snapshot.empty ? null : snapshot.docs[0];
    } else if (phone) {
      const snapshot = await db
        .collection('clients')
        .where('phone', '==', phone.trim())
        .limit(1)
        .get();
      clientDoc = snapshot.empty ? null : snapshot.docs[0];
    }

    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' },
      });
    }

    const clientData = clientDoc.data();
    const token = Buffer.from(JSON.stringify({ clientId: clientDoc.id, type: 'client' })).toString('base64');

    res.json({
      success: true,
      data: {
        clientId: clientDoc.id,
        token: `Bearer ${token}`,
        email: clientData.email,
        phone: clientData.phone,
        loyaltyPoints: clientData.loyaltyPoints,
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

export default router;
