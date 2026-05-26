// src/database/database.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('workmanager.db');

function ahoraCol(): string {
  const now = new Date();
  // UTC-5 manual — sin toLocaleString que falla en algunos entornos de Expo
  const utcMs = now.getTime();
  const colMs = utcMs - (5 * 60 * 60 * 1000);
  const col = new Date(colMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${col.getUTCFullYear()}-${pad(col.getUTCMonth() + 1)}-${pad(col.getUTCDate())} `
       + `${pad(col.getUTCHours())}:${pad(col.getUTCMinutes())}:${pad(col.getUTCSeconds())}`;
}

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

    CREATE TABLE IF NOT EXISTS _migraciones (
      id INTEGER PRIMARY KEY,
      nombre TEXT UNIQUE,
      aplicada_en TEXT
    );
  `);

  const mig1 = db.getFirstSync(
    `SELECT id FROM _migraciones WHERE nombre = 'fix_fechas_nulas'`
  );
  if (!mig1) {
    const ahora = ahoraCol();
    db.runSync(`UPDATE ventas SET created_at = ? WHERE created_at IS NULL OR TRIM(created_at) = ''`, ahora);
    db.runSync(`UPDATE abonos SET created_at = ? WHERE created_at IS NULL OR TRIM(created_at) = ''`, ahora);
    db.runSync(`UPDATE clientes SET created_at = ? WHERE created_at IS NULL OR TRIM(created_at) = ''`, ahora);
    db.runSync(`UPDATE productos SET created_at = ? WHERE created_at IS NULL OR TRIM(created_at) = ''`, ahora);
    db.runSync(`INSERT INTO _migraciones (nombre, aplicada_en) VALUES ('fix_fechas_nulas', ?)`, ahora);
  }

  const mig2 = db.getFirstSync(
    `SELECT id FROM _migraciones WHERE nombre = 'fix_fechas_nan_string'`
  );
  if (!mig2) {
    const ahora = ahoraCol();
    db.runSync(`UPDATE ventas SET created_at = ? WHERE created_at LIKE '%NaN%' OR created_at LIKE '%nan%'`, ahora);
    db.runSync(`UPDATE abonos SET created_at = ? WHERE created_at LIKE '%NaN%' OR created_at LIKE '%nan%'`, ahora);
    db.runSync(`UPDATE clientes SET created_at = ? WHERE created_at LIKE '%NaN%' OR created_at LIKE '%nan%'`, ahora);
    db.runSync(`UPDATE productos SET created_at = ? WHERE created_at LIKE '%NaN%' OR created_at LIKE '%nan%'`, ahora);
    db.runSync(`INSERT INTO _migraciones (nombre, aplicada_en) VALUES ('fix_fechas_nan_string', ?)`, ahora);
  }
}

export default db;