// src/types/index.ts
export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  foto_uri: string | null;
  limite_credito: number;
  saldo_deuda: number;
  created_at: string;
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  foto_uri: string | null;
  created_at: string;
}

export interface Venta {
  id: number;
  cliente_id: number | null;
  total: number;
  tipo_pago: 'efectivo' | 'transferencia' | 'credito';
  estado: 'pendiente' | 'pagado';
  created_at: string;
}

export interface Abono {
  id: number;
  cliente_id: number;
  monto: number;
  metodo: string;
  created_at: string;
}