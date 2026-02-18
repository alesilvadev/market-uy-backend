import Joi from 'joi';

export const productSearchSchema = Joi.object({
  code: Joi.string().required().min(1).max(50),
});

export const addToOrderSchema = Joi.object({
  code: Joi.string().required().min(1).max(50),
  quantity: Joi.number().required().integer().min(1).max(10000),
  color: Joi.string().optional(),
});

export const updateOrderItemSchema = Joi.object({
  itemId: Joi.string().required(),
  quantity: Joi.number().integer().min(0),
  color: Joi.string().optional(),
});

export const moveItemSchema = Joi.object({
  itemId: Joi.string().required(),
  from: Joi.string().required().valid('items', 'wishlistItems'),
  to: Joi.string().required().valid('items', 'wishlistItems'),
});

export const closeOrderSchema = Joi.object({
  paymentMethod: Joi.string().optional().valid('cash', 'card', 'online'),
  notes: Joi.string().optional(),
});

export const cashierLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
});

export const verifyOrderSchema = Joi.object({
  orderId: Joi.string().required(),
});

export const createCashierSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  name: Joi.string().required(),
  role: Joi.string().optional().valid('cashier', 'admin'),
});

export const batchImportProductsSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        code: Joi.string().required().max(50),
        name: Joi.string().required().max(255),
        description: Joi.string().optional(),
        price: Joi.number().required().positive(),
        image: Joi.string().optional().uri(),
        colors: Joi.array().items(Joi.string()).optional(),
        inStock: Joi.boolean().required(),
        quantity: Joi.number().required().min(0),
      })
    )
    .required(),
});

export const clientRegisterSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
}).or('email', 'phone');

export const clientLoginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
}).or('email', 'phone');

export const validateRequest = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw error;
  }
  return value;
};
