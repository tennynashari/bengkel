const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, outletId: user.outlet_id },
      process.env.JWT_SECRET || 'bengkel_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet_id: user.outlet_id,
        outletId: user.outlet_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
