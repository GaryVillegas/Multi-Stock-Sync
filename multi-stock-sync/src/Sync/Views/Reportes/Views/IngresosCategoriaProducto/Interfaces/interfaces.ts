
export interface Producto { 
  id: number;
  title: string;
  quantity: number;
  price: number;
  category_id: string;
  category: string;
  total: number;
}

export interface Venta {
  order_date: string;
  order_id: number;
  payment_method: string;
  products: Producto[];
  total_amount: number;
}

export interface PaymentMethod{
  payment_method: string;
  quantity: number;
  total: number;
}

export interface Categoria{
  id: string;
  category: string;
  cantidadProductos: number;
  productos: Producto[];
  total: number;
}

export interface IngresosProductoState {
  ventas: Venta[];
  categorias: Categoria[];
  productos: Producto[];
  categoriasFiltradas: Categoria[];
  totalFinal: number;
  categoriaActiva: string;
  metodosPago: PaymentMethod[];
  isLoading: boolean;
}