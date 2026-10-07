const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'bengkel',
  password: process.env.DB_PASSWORD || 'bengkel',
  database: process.env.DB_NAME || 'bengkel',
});

let isPostgres = false;
let sqliteDb = null;

function convertSql(sql, isPg) {
  if (isPg) {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  } else {
    return sql.replace(/\$\d+/g, '?');
  }
}

const query = async (sql, params = []) => {
  if (isPostgres) {
    const formattedSql = convertSql(sql, true);
    const res = await pgPool.query(formattedSql, params);
    return res.rows;
  } else {
    const formattedSql = convertSql(sql, false);
    return new Promise((resolve, reject) => {
      sqliteDb.all(formattedSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const get = async (sql, params = []) => {
  if (isPostgres) {
    const formattedSql = convertSql(sql, true);
    const res = await pgPool.query(formattedSql, params);
    return res.rows[0] || null;
  } else {
    const formattedSql = convertSql(sql, false);
    return new Promise((resolve, reject) => {
      sqliteDb.get(formattedSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const run = async (sql, params = []) => {
  if (isPostgres) {
    let formattedSql = convertSql(sql, true);
    if (/^INSERT INTO/i.test(formattedSql.trim()) && !/RETURNING/i.test(formattedSql)) {
      formattedSql += ' RETURNING id';
    }
    const res = await pgPool.query(formattedSql, params);
    const insertedId = res.rows && res.rows[0] ? res.rows[0].id : null;
    return { id: insertedId, changes: res.rowCount };
  } else {
    const formattedSql = convertSql(sql, false);
    return new Promise((resolve, reject) => {
      sqliteDb.run(formattedSql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

const initDatabase = async () => {
  try {
    const client = await pgPool.connect();
    client.release();
    isPostgres = true;
    console.log(`Connected to PostgreSQL database "${process.env.DB_NAME}" on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    await createTablesPg();
    await seedInitialData();
  } catch (err) {
    console.warn('⚠️  PostgreSQL connection failed:', err.message);
    console.warn('Falling back to embedded SQLite database (bengkel.db)...');

    const dbPath = path.join(__dirname, '../../bengkel.db');
    sqliteDb = new sqlite3.Database(dbPath);
    isPostgres = false;
    await createTablesSqlite();
    await seedInitialData();
  }
};

const createTablesPg = async () => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS outlets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      open_time VARCHAR(10) DEFAULT '08:00',
      close_time VARCHAR(10) DEFAULT '18:00'
    );

    CREATE TABLE IF NOT EXISTS work_bays (
      id SERIAL PRIMARY KEY,
      outlet_id INT NOT NULL REFERENCES outlets(id),
      bay_number INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      bay_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'AVAILABLE'
    );

    CREATE TABLE IF NOT EXISTS mechanics (
      id SERIAL PRIMARY KEY,
      outlet_id INT NOT NULL REFERENCES outlets(id),
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL,
      phone VARCHAR(50),
      is_active INT DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      category_id INT NOT NULL REFERENCES service_categories(id),
      name VARCHAR(150) NOT NULL,
      description TEXT,
      vehicle_type VARCHAR(20) DEFAULT 'ALL',
      is_active INT DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS service_pricing (
      id SERIAL PRIMARY KEY,
      service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      size_category VARCHAR(20) NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      estimated_duration_minutes INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL,
      outlet_id INT REFERENCES outlets(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_code VARCHAR(50) UNIQUE NOT NULL,
      outlet_id INT NOT NULL REFERENCES outlets(id),
      work_bay_id INT REFERENCES work_bays(id),
      mechanic_id INT REFERENCES mechanics(id),
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(150),
      vehicle_type VARCHAR(20) DEFAULT 'CAR',
      vehicle_brand_model VARCHAR(150) NOT NULL,
      vehicle_size VARCHAR(20) NOT NULL,
      license_plate VARCHAR(30) NOT NULL,
      vehicle_color VARCHAR(50),
      scheduled_date VARCHAR(20) NOT NULL,
      scheduled_time VARCHAR(20) NOT NULL,
      total_amount NUMERIC(12,2) NOT NULL,
      deposit_amount NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'BOOKED',
      payment_status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS booking_services (
      id SERIAL PRIMARY KEY,
      booking_id INT NOT NULL REFERENCES bookings(id),
      service_id INT NOT NULL REFERENCES services(id),
      size_category VARCHAR(20) NOT NULL,
      price NUMERIC(12,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspection_reports (
      id SERIAL PRIMARY KEY,
      booking_id INT UNIQUE NOT NULL REFERENCES bookings(id),
      scratches_data TEXT,
      initial_photos TEXT,
      fuel_level VARCHAR(50),
      odometer VARCHAR(50),
      notes TEXT,
      customer_signature_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progress_updates (
      id SERIAL PRIMARY KEY,
      booking_id INT NOT NULL REFERENCES bookings(id),
      stage_name VARCHAR(150) NOT NULL,
      photo_url TEXT,
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const createTablesSqlite = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS outlets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      open_time TEXT DEFAULT '08:00',
      close_time TEXT DEFAULT '18:00'
    );
    CREATE TABLE IF NOT EXISTS work_bays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outlet_id INTEGER NOT NULL,
      bay_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      bay_type TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE'
    );
    CREATE TABLE IF NOT EXISTS mechanics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outlet_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      vehicle_type TEXT DEFAULT 'ALL',
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS service_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      size_category TEXT NOT NULL,
      price REAL NOT NULL,
      estimated_duration_minutes INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      outlet_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT UNIQUE NOT NULL,
      outlet_id INTEGER NOT NULL,
      work_bay_id INTEGER,
      mechanic_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      vehicle_type TEXT DEFAULT 'CAR',
      vehicle_brand_model TEXT NOT NULL,
      vehicle_size TEXT NOT NULL,
      license_plate TEXT NOT NULL,
      vehicle_color TEXT,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      total_amount REAL NOT NULL,
      deposit_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'BOOKED',
      payment_status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS booking_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      size_category TEXT NOT NULL,
      price REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inspection_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      scratches_data TEXT,
      initial_photos TEXT,
      fuel_level TEXT,
      odometer TEXT,
      notes TEXT,
      customer_signature_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS progress_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      photo_url TEXT,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const seedInitialData = async () => {
  const existingCategories = await query('SELECT COUNT(*) as count FROM service_categories');
  const countCat = parseInt(existingCategories[0].count, 10);
  
  if (countCat === 0) {
    console.log('Seeding updated dummy data for Cuci Mobil, Cuci Motor & Auto Detailing Mobil...');

    // 1. Seed Outlets
    await run("INSERT INTO outlets (name, address, city, phone) VALUES (?, ?, ?, ?)", ['AutoDetailing & Wash Hub Jakarta', 'Jl. Radio Dalam No. 88, Kebayoran Baru', 'Jakarta Selatan', '0812-9988-7766']);
    await run("INSERT INTO outlets (name, address, city, phone) VALUES (?, ?, ?, ?)", ['AutoDetailing & Wash Hub Bandung', 'Jl. Riau No. 120, Cibeunying Kaler', 'Bandung', '0812-5544-3322']);

    // 2. Seed Work Bays (Pit Cuci Mobil, Pit Cuci Motor, Pit Detailing Mobil, Pit Servis General)
    await run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 1, 'Pit 1 - Car Wash & Vacuum (Cuci Mobil)', 'WASH', 'AVAILABLE']);
    await run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 2, 'Pit 2 - Bike Wash & Detailing (Cuci Motor)', 'WASH', 'AVAILABLE']);
    await run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 3, 'Pit 3 - Car Auto Detailing & Nano Coating', 'COATING', 'AVAILABLE']);
    await run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 4, 'Pit 4 - Express Polish & General Bay', 'DETAILING', 'AVAILABLE']);

    // 3. Seed Mechanics / Detailers
    await run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Budi Santoso', 'HEAD_MECHANIC', '0813-1111-2222']);
    await run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Agus Pratama', 'DETAILER', '0813-3333-4444']);
    await run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Rudi Hermawan', 'DETAILER', '0813-5555-6666']);

    // 4. Seed Service Categories (Cuci Mobil, Cuci Motor, Auto Detailing Mobil)
    await run("INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)", ['Cuci Mobil (Car Wash)', 'Layanan cuci bersih hidrolik, vacuum interior, dan semir ban mobil', 'Droplets']);
    await run("INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)", ['Cuci Motor (Bike Wash)', 'Layanan cuci busa salju, pembersihan rantai & mesin motor', 'Bike']);
    await run("INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)", ['Auto Detailing Mobil', 'Perawatan bodi mendalam, poles 3-stage, dan Nano Ceramic Coating 9H', 'Sparkles']);

    // 5. Seed Services & Pricing Matrix per Size
    
    // Category 1: CUCI MOBIL
    // Service 1: Cuci Hidrolik Wax & Vacuum Mobil
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [1, 'Cuci Hidrolik Wax & Vacuum Mobil', 'Pencucian bodi luar hidrolik, pembersihan kolong kendaraan, vacuum interior & semir ban', 'CAR']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'SMALL', 50000, 45]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'MEDIUM', 65000, 45]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'LARGE', 80000, 60]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'LUXURY', 100000, 60]);

    // Service 2: Premium Express Detailing Wash Mobil
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [1, 'Premium Express Detailing Wash & Glass Clean', 'Cuci hidrolik + pembersihan jamur kaca depan + proteksi spray sealant mengkilap', 'CAR']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'SMALL', 150000, 90]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'MEDIUM', 180000, 90]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'LARGE', 220000, 120]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'LUXURY', 280000, 120]);

    // Category 2: CUCI MOTOR
    // Service 3: Cuci Motor Salju Regular
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [2, 'Cuci Motor Salju & Semir Ban', 'Pencucian busa salju halus, pembersihan velg, pengeringan micro-fiber & semir ban', 'MOTORCYCLE']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'SMALL', 25000, 30]); // Bebek/Matic Kecil (Vario/Beat)
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'MEDIUM', 35000, 30]); // Maxi Matic (NMAX/PCX)
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'LARGE', 50000, 45]); // Motor Sport 150-250cc
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'LUXURY', 75000, 45]); // Moge / Big Bike 500cc+

    // Service 4: Cuci Motor Detailing Mesin & Rantai
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [2, 'Cuci Motor Detailing Mesin & Degreaser Rantai', 'Cuci salju + pembersihan kerak minyak mesin, degreasing rantai, & pelumasan chain lube premium', 'MOTORCYCLE']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'SMALL', 75000, 60]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'MEDIUM', 95000, 60]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'LARGE', 125000, 75]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'LUXURY', 175000, 90]);

    // Category 3: AUTO DETAILING MOBIL
    // Service 5: Nano Ceramic Coating 9H Mobil (3 Layers)
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [3, 'Nano Ceramic Coating 9H Mobil (3 Layers)', 'Perlindungan cat permanen mengkilap dengan efek daun talas tahan goresan halus & garansi 2 tahun', 'CAR']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'SMALL', 2500000, 360]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'MEDIUM', 3200000, 360]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'LARGE', 4000000, 420]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'LUXURY', 5500000, 480]);

    // Service 6: Ultimate Full Detailing Mobil (Interior + Exterior + Engine)
    await run("INSERT INTO services (category_id, name, description, vehicle_type) VALUES (?, ?, ?, ?)", [3, 'Ultimate Full Detailing Mobil Package', 'Pembersihan mendalam interior, ruang mesin, pembersihan jamur kaca, dan polish 3-stage bodi mobil', 'CAR']);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'SMALL', 1200000, 240]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'MEDIUM', 1500000, 240]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'LARGE', 1900000, 300]);
    await run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'LUXURY', 2500000, 300]);

    // Admin User
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await run("INSERT INTO users (name, email, password_hash, role, outlet_id) VALUES (?, ?, ?, ?, ?)", ['Head Admin Bengkel', 'admin@bengkel.com', hash, 'ADMIN', 1]);

    // Sample Booking
    await run(`
      INSERT INTO bookings (
        booking_code, outlet_id, work_bay_id, mechanic_id, customer_name, customer_phone, customer_email,
        vehicle_type, vehicle_brand_model, vehicle_size, license_plate, vehicle_color,
        scheduled_date, scheduled_time, total_amount, deposit_amount, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'AUTO-88219', 1, 1, 2, 'Bambang Wijaya', '081298765432', 'bambang@gmail.com',
      'CAR', 'Toyota Fortuner GR Sport', 'LARGE', 'B 1234 BKG', 'Hitam Metalik',
      '2026-10-05', '10:00', 80000, 25000, 'IN_PROGRESS', 'DP_PAID'
    ]);

    await run("INSERT INTO booking_services (booking_id, service_id, size_category, price) VALUES (?, ?, ?, ?)", [1, 1, 'LARGE', 80000]);

    await run(`
      INSERT INTO inspection_reports (booking_id, scratches_data, initial_photos, fuel_level, odometer, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [1, '{"scratches":["Bumper depan kiri baret halus"]}', '["https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?w=600"]', '3/4', '45,210 KM', 'Kondisi interior bersih.']);

    await run("INSERT INTO progress_updates (booking_id, stage_name, photo_url, notes) VALUES (?, ?, ?, ?)", [1, 'Pencucian Busa Salju & Hidrolik', 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600', 'Pencucian kolong mobil selesai.']);

    console.log('Dummy data seeding completed!');
  }
};

module.exports = {
  query,
  get,
  run,
  initDatabase,
  get isPg() { return isPostgres; }
};
