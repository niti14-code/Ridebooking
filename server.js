const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env from root
dotenv.config();

const connectDB = require('./config/database');
const scheduler = require('./services/scheduler');

// Connect to database
connectDB().then(() => {
  scheduler.start();
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/drivers', require('./routes/drivers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// DEBUG: Check frontend files
console.log('📁 Checking frontend files in root:');
const frontendFiles = ['index.html', 'booking.html', 'trips.html', 'login.html'];
frontendFiles.forEach(file => {
  console.log(`   ${file}: ${fs.existsSync(file) ? '✅' : '❌'}`);
});

// Serve static files from ROOT directory
app.use(express.static('.'));

// Explicit routes for HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));
});

app.get('/trips', (req, res) => {
  res.sendFile(path.join(__dirname, 'trips.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});