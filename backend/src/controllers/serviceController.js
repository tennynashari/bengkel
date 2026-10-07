const db = require('../config/db');

exports.getCategoriesAndServices = async (req, res) => {
  try {
    const { outletId, outlet_id } = req.query;
    const targetOutlet = outletId || outlet_id;

    const categories = await db.query('SELECT * FROM service_categories ORDER BY id ASC');
    
    let sql = 'SELECT s.id, s.category_id, s.outlet_id, s.name, s.description, s.vehicle_type, s.is_active, c.name as category_name, o.name as outlet_name FROM services s JOIN service_categories c ON s.category_id = c.id LEFT JOIN outlets o ON s.outlet_id = o.id WHERE s.is_active = 1';
    const params = [];

    if (targetOutlet && targetOutlet !== 'ALL') {
      sql += ' AND (s.outlet_id IS NULL OR s.outlet_id = ?)';
      params.push(targetOutlet);
    }
    sql += ' ORDER BY s.id ASC';

    const services = await db.query(sql, params);
    const pricings = await db.query('SELECT * FROM service_pricing');

    const servicesWithPricing = services.map(s => {
      const prices = pricings.filter(p => p.service_id === s.id);
      return { ...s, pricing: prices };
    });

    res.json({
      categories,
      services: servicesWithPricing
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const { category_id, outlet_id, name, description, vehicle_type, pricing } = req.body;
    const result = await db.run(
      'INSERT INTO services (category_id, outlet_id, name, description, vehicle_type, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [category_id || 1, outlet_id || null, name, description || '', vehicle_type || 'ALL']
    );

    const serviceId = result.id;

    if (pricing && pricing.length > 0) {
      for (const p of pricing) {
        await db.run(
          'INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)',
          [serviceId, p.size_category, p.price, p.estimated_duration_minutes || 60]
        );
      }
    }

    res.status(201).json({ message: 'Service berhasil ditambahkan', serviceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, outlet_id, name, description, vehicle_type, pricing } = req.body;

    await db.run(
      'UPDATE services SET category_id = ?, outlet_id = ?, name = ?, description = ?, vehicle_type = ? WHERE id = ?',
      [category_id, outlet_id || null, name, description, vehicle_type, id]
    );

    if (pricing && pricing.length > 0) {
      await db.run('DELETE FROM service_pricing WHERE service_id = ?', [id]);
      for (const p of pricing) {
        await db.run(
          'INSERT INTO service_pricing (service_id, size_category, price, estimated_duration_minutes) VALUES (?, ?, ?, ?)',
          [id, p.size_category, p.price, p.estimated_duration_minutes || 60]
        );
      }
    }

    res.json({ message: 'Service berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM service_pricing WHERE service_id = ?', [id]);
    await db.run('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
