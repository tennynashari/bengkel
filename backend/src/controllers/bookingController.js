const db = require('../config/db');

const generateBookingCode = (source = 'ONLINE') => {
  const prefix = (source === 'WALK_IN' || source === 'STAFF') ? 'WALK' : 'WEB';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
};

exports.createBooking = async (req, res) => {
  try {
    const {
      outlet_id,
      customer_name,
      customer_phone,
      customer_email,
      vehicle_type,
      vehicle_brand_model,
      vehicle_size,
      license_plate,
      vehicle_color,
      scheduled_date,
      scheduled_time,
      services, // Array of service IDs
      deposit_amount,
      booking_source = 'ONLINE',
      payment_proof
    } = req.body;

    if (!customer_name || !customer_phone || !license_plate || !services || services.length === 0) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh data wajib' });
    }

    // Hitung total biaya berdasarkan ukuran kendaraan
    let totalAmount = 0;
    const servicesToInsert = [];

    for (const s of services) {
      const sId = typeof s === 'object' ? s.service_id || s.id : s;
      const pricing = await db.get(
        'SELECT price FROM service_pricing WHERE service_id = ? AND size_category = ?',
        [sId, vehicle_size || 'MEDIUM']
      );
      const price = pricing ? parseFloat(pricing.price) : 0;
      totalAmount += price;
      servicesToInsert.push({ serviceId: sId, price });
    }

    const finalDeposit = deposit_amount !== undefined ? parseFloat(deposit_amount) : 0;
    const bookingCode = generateBookingCode(booking_source);

    const result = await db.run(`
      INSERT INTO bookings (
        booking_code, outlet_id, customer_name, customer_phone, customer_email,
        vehicle_type, vehicle_brand_model, vehicle_size, license_plate, vehicle_color,
        scheduled_date, scheduled_time, total_amount, deposit_amount, status, payment_status,
        payment_proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED', ?, ?)
    `, [
      bookingCode, outlet_id, customer_name, customer_phone, customer_email || '',
      vehicle_type || 'CAR', vehicle_brand_model, vehicle_size || 'MEDIUM',
      license_plate.toUpperCase(), vehicle_color || '', scheduled_date, scheduled_time,
      totalAmount, finalDeposit, finalDeposit > 0 ? 'DP_PAID' : 'PENDING',
      payment_proof || null
    ]);

    const bookingId = result.id;

    for (const item of servicesToInsert) {
      await db.run(
        'INSERT INTO booking_services (booking_id, service_id, size_category, price) VALUES (?, ?, ?, ?)',
        [bookingId, item.serviceId, vehicle_size || 'MEDIUM', item.price]
      );
    }

    res.status(201).json({
      message: 'Booking berhasil dibuat',
      bookingCode,
      bookingId,
      totalAmount,
      depositAmount: finalDeposit
    });
  } catch (err) {
    console.error('Error in createBooking:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_proof } = req.body;

    if (!payment_proof) {
      return res.status(400).json({ error: 'File atau URL bukti transfer wajib disertakan' });
    }

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking tidak ditemukan' });
    }

    await db.run('UPDATE bookings SET payment_proof = ? WHERE id = ?', [payment_proof, id]);

    res.json({ message: 'Bukti transfer berhasil diunggah. Menunggu konfirmasi staff bengkel.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, outletId, date } = req.query;
    const isPostgres = db.isPg;
    const aggFunc = isPostgres ? "STRING_AGG(s.name, ', ')" : "GROUP_CONCAT(s.name, ', ')";
    let sql = `
      SELECT b.*, o.name as outlet_name, o.whatsapp_number as outlet_wa, wb.name as bay_name, m.name as mechanic_name,
        (SELECT ${aggFunc} FROM booking_services bs JOIN services s ON bs.service_id = s.id WHERE bs.booking_id = b.id) as service_names
      FROM bookings b
      JOIN outlets o ON b.outlet_id = o.id
      LEFT JOIN work_bays wb ON b.work_bay_id = wb.id
      LEFT JOIN mechanics m ON b.mechanic_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }
    if (outletId) {
      sql += ' AND b.outlet_id = ?';
      params.push(outletId);
    }
    if (date) {
      sql += ' AND b.scheduled_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY b.created_at DESC';

    const bookings = await db.query(sql, params);
    const formattedBookings = bookings.map(b => ({
      ...b,
      total_amount: parseFloat(b.total_amount || 0),
      deposit_amount: parseFloat(b.deposit_amount || 0)
    }));
    res.json(formattedBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.trackBooking = async (req, res) => {
  try {
    const { code } = req.params;
    const searchCode = code.trim().toUpperCase();

    const booking = await db.get(`
      SELECT b.*, o.name as outlet_name, o.address as outlet_address, o.phone as outlet_phone,
             o.whatsapp_number as outlet_wa, o.bank_name, o.bank_account_number, o.bank_account_holder,
             o.secondary_bank, o.secondary_account_number, o.secondary_account_holder, o.qris_image, o.qris_merchant_name,
             wb.name as bay_name, m.name as mechanic_name
      FROM bookings b
      JOIN outlets o ON b.outlet_id = o.id
      LEFT JOIN work_bays wb ON b.work_bay_id = wb.id
      LEFT JOIN mechanics m ON b.mechanic_id = m.id
      WHERE UPPER(b.booking_code) = ? OR UPPER(b.license_plate) = ?
      ORDER BY b.id DESC LIMIT 1
    `, [searchCode, searchCode]);

    if (!booking) {
      return res.status(404).json({ error: 'Data booking / plat nomor tidak ditemukan.' });
    }

    const services = await db.query(`
      SELECT bs.*, s.name as service_name
      FROM booking_services bs
      JOIN services s ON bs.service_id = s.id
      WHERE bs.booking_id = ?
    `, [booking.id]);

    const inspection = await db.get('SELECT * FROM inspection_reports WHERE booking_id = ?', [booking.id]);
    const progress = await db.query('SELECT * FROM progress_updates WHERE booking_id = ? ORDER BY id ASC', [booking.id]);

    res.json({
      booking: {
        ...booking,
        total_amount: parseFloat(booking.total_amount || 0),
        deposit_amount: parseFloat(booking.deposit_amount || 0)
      },
      services: services.map(s => ({ ...s, price: parseFloat(s.price || 0) })),
      inspection: inspection ? {
        ...inspection,
        scratches_data: inspection.scratches_data ? JSON.parse(inspection.scratches_data) : null,
        initial_photos: inspection.initial_photos ? JSON.parse(inspection.initial_photos) : []
      } : null,
      progress
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, work_bay_id, mechanic_id, payment_status, payment_proof } = req.body;

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking tidak ditemukan' });
    }

    let updateFields = [];
    let params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (work_bay_id !== undefined) {
      updateFields.push('work_bay_id = ?');
      params.push(work_bay_id);
    }
    if (mechanic_id !== undefined) {
      updateFields.push('mechanic_id = ?');
      params.push(mechanic_id);
    }
    if (payment_status) {
      updateFields.push('payment_status = ?');
      params.push(payment_status);
    }
    if (payment_proof !== undefined) {
      updateFields.push('payment_proof = ?');
      params.push(payment_proof);
    }

    if (updateFields.length > 0) {
      params.push(id);
      await db.run(`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`, params);
    }

    if (work_bay_id && status === 'IN_PROGRESS') {
      await db.run("UPDATE work_bays SET status = 'OCCUPIED' WHERE id = ?", [work_bay_id]);
    } else if ((status === 'COMPLETED' || status === 'READY') && booking.work_bay_id) {
      await db.run("UPDATE work_bays SET status = 'AVAILABLE' WHERE id = ?", [booking.work_bay_id]);
    }

    res.json({ message: 'Status booking berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { scratches_data, initial_photos, fuel_level, odometer, notes } = req.body;

    const existing = await db.get('SELECT id FROM inspection_reports WHERE booking_id = ?', [id]);
    const scratchesJson = JSON.stringify(scratches_data || {});
    const photosJson = JSON.stringify(initial_photos || []);

    if (existing) {
      await db.run(`
        UPDATE inspection_reports
        SET scratches_data = ?, initial_photos = ?, fuel_level = ?, odometer = ?, notes = ?
        WHERE booking_id = ?
      `, [scratchesJson, photosJson, fuel_level, odometer, notes, id]);
    } else {
      await db.run(`
        INSERT INTO inspection_reports (booking_id, scratches_data, initial_photos, fuel_level, odometer, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, scratchesJson, photosJson, fuel_level, odometer, notes]);
    }

    await db.run("UPDATE bookings SET status = 'CHECKED_IN' WHERE id = ?", [id]);

    res.json({ message: 'Laporan inspeksi fisik berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addProgressUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage_name, photo_url, notes } = req.body;

    await db.run(`
      INSERT INTO progress_updates (booking_id, stage_name, photo_url, notes)
      VALUES (?, ?, ?, ?)
    `, [id, stage_name, photo_url || '', notes || '']);

    res.json({ message: 'Progres pengerjaan berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking tidak ditemukan' });
    }

    if (booking.work_bay_id) {
      await db.run("UPDATE work_bays SET status = 'AVAILABLE' WHERE id = ?", [booking.work_bay_id]);
    }

    await db.run('DELETE FROM booking_services WHERE booking_id = ?', [id]);
    await db.run('DELETE FROM inspection_reports WHERE booking_id = ?', [id]);
    await db.run('DELETE FROM progress_updates WHERE booking_id = ?', [id]);
    await db.run('DELETE FROM bookings WHERE id = ?', [id]);

    res.json({ message: 'Booking berhasil dihapus' });
  } catch (err) {
    console.error('Error in deleteBooking:', err);
    res.status(500).json({ error: err.message });
  }
};
