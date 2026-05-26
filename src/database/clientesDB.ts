// src/database/clientesDB.ts
import db from "./database";
import { Cliente } from "../types";

export function obtenerClientes(): Cliente[] {
  return db.getAllSync("SELECT * FROM clientes ORDER BY nombre ASC");
}

export function obtenerClientePorId(id: number): Cliente | null {
  return db.getFirstSync("SELECT * FROM clientes WHERE id = ?", [id]);
}

export function eliminarCliente(id: number) {
  db.runSync("DELETE FROM clientes WHERE id = ?", id);
}

function ahoraCol(): string {
  const now = new Date();
  const utcMs = now.getTime();
  const colMs = utcMs - 5 * 60 * 60 * 1000;
  const col = new Date(colMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${col.getUTCFullYear()}-${pad(col.getUTCMonth() + 1)}-${pad(col.getUTCDate())} ` +
    `${pad(col.getUTCHours())}:${pad(col.getUTCMinutes())}:${pad(col.getUTCSeconds())}`
  );
}

export function crearCliente(
  cliente: Omit<Cliente, "id" | "created_at">,
): number {
  const result = db.runSync(
    `INSERT INTO clientes (nombre, telefono, direccion, foto_uri, limite_credito, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`, // ← agregar created_at
    [
      cliente.nombre,
      cliente.telefono,
      cliente.direccion,
      cliente.foto_uri,
      cliente.limite_credito,
      ahoraCol(),
    ],
  );
  return result.lastInsertRowId;
}

export function actualizarCliente(id: number, datos: Partial<Cliente>) {
  db.runSync(
    `UPDATE clientes SET nombre=?, telefono=?, direccion=?, limite_credito=?, foto_uri=? WHERE id=?`,
    datos.nombre ?? "",
    datos.telefono ?? "",
    datos.direccion ?? "",
    datos.limite_credito ?? 0,
    datos.foto_uri ?? null,
    id,
  );
}

export function registrarAbono(
  clienteId: number,
  monto: number,
  metodo: string,
) {
  try {
    db.runSync(
      "INSERT INTO abonos (cliente_id, monto, metodo, created_at) VALUES (?, ?, ?, ?)",
      clienteId,
      monto,
      metodo,
      ahoraCol(), // ← timestamp Colombia
    );
    db.runSync(
      "UPDATE clientes SET saldo_deuda = saldo_deuda - ? WHERE id = ?",
      monto,
      clienteId,
    );
  } catch (e) {
    throw e;
  }
}
export function obtenerAbonosPorCliente(clienteId: number): any[] {
  return db.getAllSync(
    `
    SELECT a.*, 'abono' as tipo
    FROM abonos a
    WHERE a.cliente_id = ?
    ORDER BY a.created_at DESC
  `,
    clienteId,
  );
}

export function obtenerVentasPorCliente(clienteId: number): any[] {
  return db.getAllSync(
    `
    SELECT v.*, 'venta' as tipo
    FROM ventas v
    WHERE v.cliente_id = ?
    ORDER BY v.created_at DESC
  `,
    clienteId,
  );
}

export function obtenerHistorialCliente(clienteId: number): any[] {
  return db.getAllSync(
    `
    SELECT id, 'abono' as tipo, monto, metodo as detalle, created_at
    FROM abonos WHERE cliente_id = ?
    UNION ALL
    SELECT id, 'venta' as tipo, total as monto, tipo_pago as detalle, created_at
    FROM ventas WHERE cliente_id = ?
    ORDER BY created_at DESC
  `,
    clienteId,
    clienteId,
  );
}
