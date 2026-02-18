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

export const validateRequest = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw error;
  }
  return value;
};
