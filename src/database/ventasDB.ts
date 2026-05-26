import db from './database';
import { Venta } from '../types';

function ahoraCol(): string {
  const now = new Date();
  const utcMs = now.getTime();
  const colMs = utcMs - (5 * 60 * 60 * 1000);
  const col = new Date(colMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${col.getUTCFullYear()}-${pad(col.getUTCMonth() + 1)}-${pad(col.getUTCDate())} `
       + `${pad(col.getUTCHours())}:${pad(col.getUTCMinutes())}:${pad(col.getUTCSeconds())}`;
}

export function obtenerVentas(): Venta[] {
  return db.getAllSync(`
    SELECT v.*, c.nombre as cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.created_at DESC
  `);
}

export function obtenerVentasHoy(): Venta[] {
  // Comparar contra fecha Colombia
  const hoyCol = ahoraCol().substring(0, 10); // "YYYY-MM-DD"
  return db.getAllSync(`
    SELECT v.*, c.nombre as cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE substr(v.created_at, 1, 10) = ?
    ORDER BY v.created_at DESC
  `, hoyCol);
}

export function crearVenta(
  clienteId: number | null,
  total: number,
  tipoPago: string,
  items: { productoId: number; cantidad: number; precioUnitario: number }[]
): number {
  try {
    // Solo es crédito si el tipo de pago es 'credito' Y hay cliente
    const esPagoCredito = tipoPago === 'credito' && clienteId !== null;
    const estado = esPagoCredito ? 'pendiente' : 'pagado';

    // Insertar venta con timestamp Colombia
    const result = db.runSync(
      `INSERT INTO ventas (cliente_id, total, tipo_pago, estado, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      clienteId ?? null,
      total,
      tipoPago,
      estado,
      ahoraCol() 
    );
    const ventaId = result.lastInsertRowId;

    // Insertar items y descontar stock
    for (const item of items) {
      db.runSync(
        `INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
        ventaId, item.productoId, item.cantidad, item.precioUnitario
      );
      db.runSync(
        `UPDATE productos SET stock = stock - ? WHERE id = ?`,
        item.cantidad, item.productoId
      );
    }

    // SOLO sumar deuda si es crédito — efectivo y transferencia NO suman deuda
    if (esPagoCredito) {
      db.runSync(
        `UPDATE clientes SET saldo_deuda = saldo_deuda + ? WHERE id = ?`,
        total, clienteId
      );
    }

    return ventaId;
  } catch (e) {
    throw e;
  }
}

export function obtenerTotalHoy(): number {
  const hoyCol = ahoraCol().substring(0, 10);
  const result: any = db.getFirstSync(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM ventas
    WHERE substr(created_at, 1, 10) = ?
  `, hoyCol);
  return result?.total ?? 0;
}

export function obtenerTotalAyer(): number {
  const now = new Date();
  const col = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  col.setDate(col.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ayerCol = `${col.getFullYear()}-${pad(col.getMonth()+1)}-${pad(col.getDate())}`;

  const result: any = db.getFirstSync(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM ventas
    WHERE substr(created_at, 1, 10) = ?
  `, ayerCol);
  return result?.total ?? 0;
}

export function obtenerItemsVenta(ventaId: number): any[] {
  return db.getAllSync(`
    SELECT vi.cantidad, vi.precio_unitario, p.nombre as producto_nombre
    FROM venta_items vi
    JOIN productos p ON vi.producto_id = p.id
    WHERE vi.venta_id = ?
  `, ventaId);
}