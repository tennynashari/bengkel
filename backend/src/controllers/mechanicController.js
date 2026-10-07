const db = require('../config/db');

const getMechanics = async (req, res) => {
  try {
    const { outletId } = req.query;
    let sql = 'SELECT * FROM mechanics';
    const params = [];

    if (outletId) {
      sql += ' WHERE outlet_id = ?';
      params.push(outletId);
    }
    sql += ' ORDER BY id ASC';

    const mechanics = await db.query(sql, params);
    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMechanic = async (req, res) => {
  try {
    const { outlet_id = 1, name, role = 'Head Mechanic', phone = '', is_active = 1 } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama mekanik wajib diisi' });
    }

    const result = await db.run(
      'INSERT INTO mechanics (outlet_id, name, role, phone, is_active) VALUES (?, ?, ?, ?, ?)',
      [outlet_id, name, role, phone, is_active]
    );

    res.status(201).json({
      message: 'Data mekanik berhasil ditambahkan',
      mechanicId: result.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMechanic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, is_active } = req.body;

    const mechanic = await db.get('SELECT * FROM mechanics WHERE id = ?', [id]);
    if (!mechanic) {
      return res.status(404).json({ error: 'Data mekanik tidak ditemukan' });
    }

    await db.run(
      'UPDATE mechanics SET name = ?, role = ?, phone = ?, is_active = ? WHERE id = ?',
      [
        name || mechanic.name,
        role || mechanic.role,
        phone !== undefined ? phone : mechanic.phone,
        is_active !== undefined ? is_active : mechanic.is_active,
        id
      ]
    );

    res.json({ message: 'Data mekanik berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMechanic = async (req, res) => {
  try {
    const { id } = req.params;

    // Unassign from bookings first to prevent FK violation
    await db.run('UPDATE bookings SET mechanic_id = NULL WHERE mechanic_id = ?', [id]);
    await db.run('DELETE FROM mechanics WHERE id = ?', [id]);

    res.json({ message: 'Data mekanik berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMechanics,
  getAllMechanics: getMechanics,
  createMechanic,
  updateMechanic,
  deleteMechanic
};
