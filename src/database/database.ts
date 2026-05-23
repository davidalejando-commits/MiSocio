// src/database/database.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('workmanager.db');

export function initDatabase() {
  
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      direccion TEXT,
      foto_uri TEXT,
      limite_credito REAL DEFAULT 0,
      saldo_deuda REAL DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT,
      precio REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      foto_uri TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      total REAL NOT NULL,
      tipo_pago TEXT DEFAULT 'efectivo',
      estado TEXT DEFAULT 'pendiente',
      created_at TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS venta_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER,
      precio_unitario REAL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    CREATE TABLE IF NOT EXISTS abonos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      venta_id INTEGER,
      monto REAL NOT NULL,
      metodo TEXT DEFAULT 'efectivo',
      created_at TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );
  `);
   db.execSync(`
    UPDATE ventas 
    SET created_at = '2026-05-22 00:00:00' 
    WHERE created_at IS NULL OR created_at = '' OR created_at = 'NaN';

    UPDATE abonos 
    SET created_at = '2026-05-22 00:00:00' 
    WHERE created_at IS NULL OR created_at = '' OR created_at = 'NaN';
  `);

}

export default db;