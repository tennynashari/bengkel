require('dotenv').config();
const db = require('./src/config/db');

async function checkAndReseed() {
  console.log('=== FORCING COMPLETE DB RE-SEED (WITH WEB- & WALK- BOOKINGS) ===');
  await db.initDatabase();

  try {
    console.log('Truncating tables and resetting identity sequences...');
    if (db.isPg) {
      await db.run('TRUNCATE outlets, work_bays, mechanics, service_categories, services, service_pricing, users, bookings, booking_services, inspection_reports, progress_updates RESTART IDENTITY CASCADE');
    } else {
      await db.run('DELETE FROM booking_services');
      await db.run('DELETE FROM progress_updates');
      await db.run('DELETE FROM inspection_reports');
      await db.run('DELETE FROM bookings');
      await db.run('DELETE FROM service_pricing');
      await db.run('DELETE FROM services');
      await db.run('DELETE FROM service_categories');
      await db.run('DELETE FROM users');
      await db.run('DELETE FROM mechanics');
      await db.run('DELETE FROM work_bays');
      await db.run('DELETE FROM outlets');
    }

    console.log('Inserting Outlets...');
    if (db.isPg) {
      await db.query("INSERT INTO outlets (id, name, address, city, phone) VALUES (1, $1, $2, $3, $4)", ['AutoDetailing & Wash Hub Jakarta', 'Jl. Radio Dalam No. 88, Kebayoran Baru', 'Jakarta Selatan', '0812-9988-7766']);
      await db.query("INSERT INTO outlets (id, name, address, city, phone) VALUES (2, $1, $2, $3, $4)", ['AutoDetailing & Wash Hub Bandung', 'Jl. Riau No. 120, Cibeunying Kaler', 'Bandung', '0812-5544-3322']);
      await db.query("SELECT setval('outlets_id_seq', (SELECT MAX(id) FROM outlets))");
    } else {
      await db.run("INSERT INTO outlets (id, name, address, city, phone) VALUES (1, ?, ?, ?, ?)", ['AutoDetailing & Wash Hub Jakarta', 'Jl. Radio Dalam No. 88, Kebayoran Baru', 'Jakarta Selatan', '0812-9988-7766']);
      await db.run("INSERT INTO outlets (id, name, address, city, phone) VALUES (2, ?, ?, ?, ?)", ['AutoDetailing & Wash Hub Bandung', 'Jl. Riau No. 120, Cibeunying Kaler', 'Bandung', '0812-5544-3322']);
    }

    console.log('Inserting 8 Work Bays for Outlet 1...');
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 1, 'Pit 1 - Car Wash Bay 1', 'WASH', 'OCCUPIED']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 2, 'Pit 2 - Car Wash Bay 2', 'WASH', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 3, 'Pit 3 - Bike Wash Bay 1', 'WASH', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 4, 'Pit 4 - Bike Wash Bay 2', 'WASH', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 5, 'Pit 5 - Car Detailing & Coating Bay 1', 'COATING', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 6, 'Pit 6 - Car Detailing & Coating Bay 2', 'COATING', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 7, 'Pit 7 - Bike Detailing & Coating Bay 1', 'DETAILING', 'AVAILABLE']);
    await db.run("INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status) VALUES (?, ?, ?, ?, ?)", [1, 8, 'Pit 8 - Bike Detailing & Coating Bay 2', 'DETAILING', 'AVAILABLE']);

    console.log('Inserting Mechanics...');
    await db.run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Budi Santoso', 'HEAD_MECHANIC', '0813-1111-2222']);
    await db.run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Agus Pratama', 'DETAILER', '0813-3333-4444']);
    await db.run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Rudi Hermawan', 'DETAILER', '0813-5555-6666']);
    await db.run("INSERT INTO mechanics (outlet_id, name, role, phone) VALUES (?, ?, ?, ?)", [1, 'Deni Kurniawan', 'WASHER', '0813-7777-8888']);

    console.log('Inserting Service Categories...');
    if (db.isPg) {
      await db.query("INSERT INTO service_categories (id, name, description, icon) VALUES (1, $1, $2, $3)", ['Cuci Kendaraan (Wash Only)', 'Layanan cuci bersih busa salju, hidrolik, vacuum & semir ban', 'Droplets']);
      await db.query("INSERT INTO service_categories (id, name, description, icon) VALUES (2, $1, $2, $3)", ['Detailing & Coating', 'Poles bodi profesional & pelapisan Nano Ceramic Coating 9H', 'Sparkles']);
      await db.query("INSERT INTO service_categories (id, name, description, icon) VALUES (3, $1, $2, $3)", ['Full Package (All-in-One)', 'Paket perawatan menyeluruh cuci, detailing interior/mesin, dan coating', 'ShieldCheck']);
      await db.query("SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories))");
    } else {
      await db.run("INSERT INTO service_categories (id, name, description, icon) VALUES (1, ?, ?, ?)", ['Cuci Kendaraan (Wash Only)', 'Layanan cuci bersih busa salju, hidrolik, vacuum & semir ban', 'Droplets']);
      await db.run("INSERT INTO service_categories (id, name, description, icon) VALUES (2, ?, ?, ?)", ['Detailing & Coating', 'Poles bodi profesional & pelapisan Nano Ceramic Coating 9H', 'Sparkles']);
      await db.run("INSERT INTO service_categories (id, name, description, icon) VALUES (3, ?, ?, ?)", ['Full Package (All-in-One)', 'Paket perawatan menyeluruh cuci, detailing interior/mesin, dan coating', 'ShieldCheck']);
    }

    console.log('Inserting 6 Services & Pricing Matrix...');
    
    // Service 1: Car Wash Saja
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (1, 1, $1, $2, $3)", ['Car Wash Saja (Hidrolik & Vacuum)', 'Cuci bodi luar hidrolik, pembersihan kolong, vacuum interior & semir ban', 'CAR']);
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (1, 1, ?, ?, ?)", ['Car Wash Saja (Hidrolik & Vacuum)', 'Cuci bodi luar hidrolik, pembersihan kolong, vacuum interior & semir ban', 'CAR']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'SMALL', 50000, 45]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'MEDIUM', 65000, 45]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'LARGE', 80000, 60]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [1, 'LUXURY', 100000, 60]);

    // Service 2: Bike Wash Saja
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (2, 1, $1, $2, $3)", ['Bike Wash Saja (Salju & Semir Ban)', 'Cuci busa salju halus, pembersihan velg, pengeringan microfiber & semir ban', 'MOTORCYCLE']);
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (2, 1, ?, ?, ?)", ['Bike Wash Saja (Salju & Semir Ban)', 'Cuci busa salju halus, pembersihan velg, pengeringan microfiber & semir ban', 'MOTORCYCLE']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'SMALL', 25000, 30]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'MEDIUM', 35000, 30]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'LARGE', 50000, 45]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [2, 'LUXURY', 75000, 45]);

    // Service 3: Car Detailing & Coating
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (3, 2, $1, $2, $3)", ['Car Detailing & Nano Ceramic Coating', 'Poles bodi 2-stage, jamur kaca, dan pelapisan Nano Ceramic Coating 9H (Garansi 2 Thn)', 'CAR']);
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (3, 2, ?, ?, ?)", ['Car Detailing & Nano Ceramic Coating', 'Poles bodi 2-stage, jamur kaca, dan pelapisan Nano Ceramic Coating 9H (Garansi 2 Thn)', 'CAR']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'SMALL', 2200000, 360]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'MEDIUM', 2800000, 360]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'LARGE', 3500000, 420]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [3, 'LUXURY', 4800000, 480]);

    // Service 4: Bike Detailing & Coating
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (4, 2, $1, $2, $3)", ['Bike Detailing & Nano Ceramic Coating', 'Detailing mesin/velg, poles bodi/tangki, & pelapisan Nano Ceramic Coating 9H', 'MOTORCYCLE']);
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (4, 2, ?, ?, ?)", ['Bike Detailing & Nano Ceramic Coating', 'Detailing mesin/velg, poles bodi/tangki, & pelapisan Nano Ceramic Coating 9H', 'MOTORCYCLE']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'SMALL', 650000, 180]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'MEDIUM', 850000, 180]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'LARGE', 1200000, 240]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [4, 'LUXURY', 1800000, 240]);

    // Service 5: Car Full Package
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (5, 3, $1, $2, $3)", ['Car Full Package Ultimate', 'Paket Komplit: Wash Hidrolik + Full Interior Steam + Engine Clean + Glass Protection + 3-Layer Coating', 'CAR']);
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (5, 3, ?, ?, ?)", ['Car Full Package Ultimate', 'Paket Komplit: Wash Hidrolik + Full Interior Steam + Engine Clean + Glass Protection + 3-Layer Coating', 'CAR']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'SMALL', 3500000, 480]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'MEDIUM', 4200000, 480]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'LARGE', 5200000, 540]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [5, 'LUXURY', 6800000, 600]);

    // Service 6: Bike Full Package
    if (db.isPg) {
      await db.query("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (6, 3, $1, $2, $3)", ['Bike Full Package Ultimate', 'Paket Komplit: Wash Degreaser + Chain Lube + Full Polish + 9H Ceramic Coating + Free Helmet Protection', 'MOTORCYCLE']);
      await db.query("SELECT setval('services_id_seq', (SELECT MAX(id) FROM services))");
    } else {
      await db.run("INSERT INTO services (id, category_id, name, description, vehicle_type) VALUES (6, 3, ?, ?, ?)", ['Bike Full Package Ultimate', 'Paket Komplit: Wash Degreaser + Chain Lube + Full Polish + 9H Ceramic Coating + Free Helmet Protection', 'MOTORCYCLE']);
    }
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'SMALL', 950000, 240]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'MEDIUM', 1250000, 240]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'LARGE', 1750000, 300]);
    await db.run("INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)", [6, 'LUXURY', 2500000, 300]);

    console.log('Inserting Admin User...');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await db.run("INSERT INTO users (name, email, password_hash, role, outlet_id) VALUES (?, ?, ?, ?, ?)", ['Head Admin Bengkel', 'admin@bengkel.com', hash, 'ADMIN', 1]);

    let bay1Res = await db.query("SELECT id FROM work_bays WHERE outlet_id = 1 ORDER BY id ASC LIMIT 1");
    let bay1Id = bay1Res.length > 0 ? bay1Res[0].id : null;
    let mechRes = await db.query("SELECT id FROM mechanics WHERE outlet_id = 1 ORDER BY id ASC LIMIT 1");
    let mechId = mechRes.length > 0 ? mechRes[0].id : null;

    console.log('Inserting Initial WEB- & WALK- Active Bookings...');
    
    // Booking 1: WEB-88219 (Landing Page Online Reservation)
    await db.run(
      "INSERT INTO bookings (booking_code, outlet_id, work_bay_id, mechanic_id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_brand_model, vehicle_size, license_plate, vehicle_color, scheduled_date, scheduled_time, total_amount, deposit_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ['WEB-88219', 1, bay1Id, mechId, 'Bambang Wijaya', '081298765432', 'bambang@gmail.com', 'CAR', 'Toyota Fortuner GR Sport', 'LARGE', 'B 1234 BKG', 'Hitam Metalik', '2026-10-05', '10:00', 80000, 25000, 'IN_PROGRESS', 'DP_PAID']
    );
    let b1Res = await db.query("SELECT id FROM bookings ORDER BY id DESC LIMIT 1");
    let b1Id = b1Res[0].id;
    await db.run("INSERT INTO booking_services (booking_id, service_id, size_category, price) VALUES (?, ?, ?, ?)", [b1Id, 1, 'LARGE', 80000]);
    await db.run(
      "INSERT INTO inspection_reports (booking_id, scratches_data, initial_photos, fuel_level, odometer, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [b1Id, '{"scratches":["Bumper depan kiri baret halus"]}', '["https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?w=600"]', '3/4', '45,210 KM', 'Kondisi interior bersih.']
    );
    await db.run(
      "INSERT INTO progress_updates (booking_id, stage_name, photo_url, notes) VALUES (?, ?, ?, ?)",
      [b1Id, 'Pencucian Busa Salju & Hidrolik', 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600', 'Pencucian kolong mobil selesai.']
    );

    // Booking 2: WALK-10492 (Staff Onsite Walk-In)
    await db.run(
      "INSERT INTO bookings (booking_code, outlet_id, customer_name, customer_phone, customer_email, vehicle_type, vehicle_brand_model, vehicle_size, license_plate, vehicle_color, scheduled_date, scheduled_time, total_amount, deposit_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ['WALK-10492', 1, 'Eko Prasetyo', '081377889900', 'eko@gmail.com', 'MOTORCYCLE', 'Honda Vario 160 CBS', 'MEDIUM', 'B 5678 MTR', 'Merah Doff', '2026-10-05', '11:00', 35000, 0, 'BOOKED', 'PENDING']
    );
    let b2Res = await db.query("SELECT id FROM bookings ORDER BY id DESC LIMIT 1");
    let b2Id = b2Res[0].id;
    await db.run("INSERT INTO booking_services (booking_id, service_id, size_category, price) VALUES (?, ?, ?, ?)", [b2Id, 2, 'MEDIUM', 35000]);

    console.log('✅ DATABASE RE-SEEDED WITH WEB- & WALK- BOOKINGS!');
    process.exit(0);
  } catch (err) {
    console.error('Error during clean re-seed:', err);
    process.exit(1);
  }
}

checkAndReseed();
