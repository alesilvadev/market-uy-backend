import { Router, Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { validateRequest, productSearchSchema } from '../utils/validation';
import { errorHandler } from '../utils/errors';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const products = await ProductService.getAll(limit, offset);

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

router.post('/search', async (req: Request, res: Response) => {
  try {
    const { code } = validateRequest(productSearchSchema, req.body);
    const product = await ProductService.searchByCode(code);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
    }

    res.json({
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

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductService.getById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      });
    }

    res.json({
      success: true,
      data: product,
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
