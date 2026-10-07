const db = require('../config/db');

exports.getBays = async (req, res) => {
  try {
    const { outletId } = req.query;
    let sql = `
      SELECT b.*, o.name as outlet_name,
             bk.booking_code, bk.customer_name, bk.license_plate, bk.vehicle_brand_model, bk.status as booking_status, bk.scheduled_time
      FROM work_bays b
      JOIN outlets o ON b.outlet_id = o.id
      LEFT JOIN bookings bk ON b.id = bk.work_bay_id AND bk.status IN ('IN_PROGRESS', 'CHECKED_IN', 'QC')
    `;
    const params = [];
    if (outletId) {
      sql += ' WHERE b.outlet_id = ?';
      params.push(outletId);
    }
    sql += ' ORDER BY b.bay_number ASC';

    const bays = await db.query(sql, params);
    const mechanics = await db.query('SELECT * FROM mechanics WHERE is_active = 1');

    res.json({ bays, mechanics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBay = async (req, res) => {
  try {
    const { outlet_id, bay_number, name, bay_type, status } = req.body;
    const result = await db.run(`
      INSERT INTO work_bays (outlet_id, bay_number, name, bay_type, status)
      VALUES (?, ?, ?, ?, ?)
    `, [outlet_id || 1, bay_number || 1, name, bay_type || 'WASH', status || 'AVAILABLE']);
    res.status(201).json({ message: 'Pit / Work Bay berhasil dibuat', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBay = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bay_type, status, bay_number } = req.body;
    await db.run(`
      UPDATE work_bays
      SET name = ?, bay_type = ?, status = ?, bay_number = ?
      WHERE id = ?
    `, [name, bay_type, status, bay_number, id]);
    res.json({ message: 'Pit / Work Bay berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBay = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM work_bays WHERE id = ?', [id]);
    res.json({ message: 'Pit / Work Bay berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
