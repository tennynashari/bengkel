const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const sql = "SELECT u.id, u.name, u.email, u.role, u.outlet_id, o.name as outlet_name, o.city as outlet_city FROM users u LEFT JOIN outlets o ON u.outlet_id = o.id ORDER BY u.id ASC";
    const users = await db.query(sql);
    res.json(users.rows || users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, outlet_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Gunakan email lain.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role || 'BRANCH_ADMIN';
    const targetOutlet = userRole === 'SUPER_ADMIN' ? null : (outlet_id ? Number(outlet_id) : null);

    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, outlet_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, userRole, targetOutlet]
    );

    res.status(201).json({ message: 'User berhasil ditambahkan', userId: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, outlet_id } = req.body;

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    if (email && email !== existing.email) {
      const dup = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (dup) {
        return res.status(400).json({ error: 'Email sudah digunakan oleh user lain.' });
      }
    }

    const userRole = role || existing.role;
    const targetOutlet = userRole === 'SUPER_ADMIN' ? null : (outlet_id !== undefined ? (outlet_id ? Number(outlet_id) : null) : existing.outlet_id);

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      await db.run(
        'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, outlet_id = ? WHERE id = ?',
        [name || existing.name, email || existing.email, hash, userRole, targetOutlet, id]
      );
    } else {
      await db.run(
        'UPDATE users SET name = ?, email = ?, role = ?, outlet_id = ? WHERE id = ?',
        [name || existing.name, email || existing.email, userRole, targetOutlet, id]
      );
    }

    res.json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
