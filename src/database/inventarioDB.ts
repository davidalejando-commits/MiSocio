// src/database/inventarioDB.ts
import db from './database';
import { Producto } from '../types';

export function obtenerProductos(): Producto[] {
  return db.getAllSync('SELECT * FROM productos ORDER BY nombre ASC');
}

export function obtenerProductoPorId(id: number): Producto | null {
  return db.getFirstSync('SELECT * FROM productos WHERE id = ?', id);
}

export function crearProducto(producto: Omit<Producto, 'id' | 'created_at'>): number {
  const result = db.runSync(
    `INSERT INTO productos (nombre, categoria, precio, stock, foto_uri)
     VALUES (?, ?, ?, ?, ?)`,
    producto.nombre,
    producto.categoria,
    producto.precio,
    producto.stock,
    producto.foto_uri ?? null
  );
  return result.lastInsertRowId;
}

export function actualizarStock(id: number, nuevoStock: number) {
  db.runSync(
    'UPDATE productos SET stock = ? WHERE id = ?',
    nuevoStock, id
  );
}

export function actualizarProducto(id: number, datos: Partial<Producto>) {
  db.runSync(
    `UPDATE productos SET nombre=?, categoria=?, precio=?, stock=?, foto_uri=? WHERE id=?`,
    datos.nombre ?? '',
    datos.categoria ?? '',
    datos.precio ?? 0,
    datos.stock ?? 0,
    datos.foto_uri ?? null,
    id
  );
}

export function eliminarProducto(id: number) {
  db.runSync('DELETE FROM productos WHERE id = ?', id);
}

export function obtenerProductosBajoStock(minimo: number = 5): Producto[] {
  return db.getAllSync(
    'SELECT * FROM productos WHERE stock <= ? ORDER BY stock ASC',
    minimo
  );
}