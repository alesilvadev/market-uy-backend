export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  colors?: string[];
  inStock: boolean;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  image?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  clientId?: string;
  items: OrderItem[];
  wishlistItems: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'paid' | 'ready' | 'delivered';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'cash' | 'card' | 'online';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface Cashier {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'cashier' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
