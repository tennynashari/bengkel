const db = require('../config/db');

exports.getOutlets = async (req, res) => {
  try {
    const outlets = await db.query('SELECT * FROM outlets ORDER BY id ASC');
    res.json(outlets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOutletById = async (req, res) => {
  try {
    const { id } = req.params;
    const outlet = await db.get('SELECT * FROM outlets WHERE id = ?', [id]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet tidak ditemukan' });
    }
    res.json(outlet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      address, 
      city, 
      phone, 
      whatsapp_number,
      bank_name, 
      bank_account_number, 
      bank_account_holder,
      secondary_bank,
      secondary_account_number,
      secondary_account_holder,
      qris_image,
      qris_merchant_name,
      open_time, 
      close_time 
    } = req.body;

    const existing = await db.get('SELECT * FROM outlets WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Outlet tidak ditemukan' });
    }

    await db.run(`
      UPDATE outlets SET
        name = ?,
        address = ?,
        city = ?,
        phone = ?,
        whatsapp_number = ?,
        bank_name = ?,
        bank_account_number = ?,
        bank_account_holder = ?,
        secondary_bank = ?,
        secondary_account_number = ?,
        secondary_account_holder = ?,
        qris_image = ?,
        qris_merchant_name = ?,
        open_time = ?,
        close_time = ?
      WHERE id = ?
    `, [
      name || existing.name,
      address || existing.address,
      city || existing.city,
      phone || existing.phone,
      whatsapp_number !== undefined ? whatsapp_number : existing.whatsapp_number,
      bank_name !== undefined ? bank_name : existing.bank_name,
      bank_account_number !== undefined ? bank_account_number : existing.bank_account_number,
      bank_account_holder !== undefined ? bank_account_holder : existing.bank_account_holder,
      secondary_bank !== undefined ? secondary_bank : existing.secondary_bank,
      secondary_account_number !== undefined ? secondary_account_number : existing.secondary_account_number,
      secondary_account_holder !== undefined ? secondary_account_holder : existing.secondary_account_holder,
      qris_image !== undefined ? qris_image : existing.qris_image,
      qris_merchant_name !== undefined ? qris_merchant_name : existing.qris_merchant_name,
      open_time || existing.open_time,
      close_time || existing.close_time,
      id
    ]);

    const updated = await db.get('SELECT * FROM outlets WHERE id = ?', [id]);
    res.json({ message: 'Pengaturan outlet dan QRIS berhasil diperbarui', outlet: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.createOutlet = async (req, res) => {
  try {
    const { code, name, address, city = 'Jakarta', phone, bca_account_number, bca_account_holder, mandiri_account_number, mandiri_account_holder, qris_merchant_name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama cabang wajib diisi' });
    }
    const outletCode = code || 'OUTLET-' + Math.floor(100 + Math.random() * 900);
    
    await db.run(`
      INSERT INTO outlets (code, name, address, city, phone, is_active, bca_account_number, bca_account_holder, mandiri_account_number, mandiri_account_holder, qris_merchant_name)
      VALUES (?, ?, ?, ?, ?, true, ?, ?, ?, ?, ?)
    `, [outletCode, name, address || '', city, phone || '', bca_account_number || '', bca_account_holder || '', mandiri_account_number || '', mandiri_account_holder || '', qris_merchant_name || '']);

    const newOutlet = await db.get('SELECT * FROM outlets ORDER BY id DESC LIMIT 1');
    res.status(201).json({ message: 'Cabang bengkel berhasil ditambahkan', outlet: newOutlet });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE outlets SET is_active = false WHERE id = ?', [id]);
    res.json({ message: 'Cabang berhasil dinonaktifkan' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
