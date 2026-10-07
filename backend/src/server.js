const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const outletRoutes = require('./routes/outletRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bayRoutes = require('./routes/bayRoutes');
const mechanicRoutes = require('./routes/mechanicRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Allow large base64 image uploads for transfer proofs and car inspection photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bays', bayRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Bengkel Auto Detailing API Server', timestamp: new Date() });
});

// Initialize DB and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Bengkel Auto Detailing Backend API Server Running`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
});
