import { Router, Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { validateRequest, productSearchSchema } from '../utils/validation';
import { errorHandler } from '../utils/errors';

const router = Router();

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
