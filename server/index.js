require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { Pool } = require('pg');
let db;

// DB init: if DATABASE_URL points to postgres, use pg; otherwise use sqlite file
const DATABASE_URL = process.env.DATABASE_URL || '';
if (DATABASE_URL.startsWith('postgres')) {
  const pool = new Pool({ connectionString: DATABASE_URL });
  db = {
    query: (text, params) => pool.query(text, params),
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        company TEXT,
        role TEXT,
        services TEXT,
        budget TEXT,
        timeline TEXT,
        message TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    }
  };
} else {
  // JSON-file fallback for local development (no native modules required)
  const dbFile = path.join(__dirname, 'data.json');
  const fs = require('fs');
  function readAll() {
    try { return JSON.parse(fs.readFileSync(dbFile, 'utf8') || '[]'); } catch (e) { return []; }
  }
  function writeAll(rows) { fs.writeFileSync(dbFile, JSON.stringify(rows, null, 2)); }
  db = {
    query(text, params) {
      if (text.startsWith('INSERT')) {
        const rows = readAll();
        const id = (rows.length ? (rows[rows.length-1].id || rows.length) + 1 : 1);
        const [name,email,phone,company,role,services,budget,timeline,message,source] = params;
        const rec = { id, name, email, phone, company, role, services, budget, timeline, message, source, created_at: new Date().toISOString() };
        rows.push(rec);
        writeAll(rows);
        return { lastInsertRowid: id };
      }
      if (text.startsWith('SELECT')) {
        const rows = readAll();
        // support ORDER BY created_at DESC
        rows.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
        return { rows };
      }
    },
    init() {
      if (!fs.existsSync(dbFile)) writeAll([]);
    }
  };
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - allow requests from frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// serve admin static
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// serve frontend static files (HTML, CSS, JS) from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Basic health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Submit endpoint
app.post('/api/submit', async (req, res) => {
  try {
    const p = req.body || {};
    const name = p.name || '';
    const email = p.email || '';
    const phone = p.phone || '';
    const company = p.company || '';
    const role = p.role || '';
    const services = p.services || '';
    const budget = p.budget || '';
    const timeline = p.timeline || '';
    const message = p.message || '';
    const source = req.headers['referer'] || req.body.source || '';

    // persist
    if (DATABASE_URL.startsWith('postgres')) {
      await db.query(`INSERT INTO submissions (name,email,phone,company,role,services,budget,timeline,message,source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [name,email,phone,company,role,services,budget,timeline,message,source]);
    } else {
      db.query('INSERT INTO submissions (name,email,phone,company,role,services,budget,timeline,message,source) VALUES (?,?,?,?,?,?,?,?,?,?)', [name,email,phone,company,role,services,budget,timeline,message,source]);
    }

    // respond success immediately (data is saved)
    res.json({ ok: true });

    // send emails in background (don't block the response)
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || (Number(process.env.SMTP_PORT) || 465) === 465,
        auth: {
          user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      const from = process.env.FROM_EMAIL || 'info@matsenseai.co.uk';

      // thank-you email to submitter
      if (email) {
        await transporter.sendMail({
          from,
          to: email,
          subject: 'Thanks — we received your request',
          text: `Hi ${name || ''},\n\nThanks — we received your request and will reply within one business day.\n\n— MatsenseAI`,
        });
        console.log('Thank-you email sent to', email);
      }

      // admin copy
      await transporter.sendMail({
        from,
        to: process.env.ADMIN_EMAILS || 'matsenseai@gmail.com,info@matsenseai.co.uk',
        subject: `New contact form submission from ${name || email}`,
        text: `New submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\nRole: ${role}\nServices: ${services}\nBudget: ${budget}\nTimeline: ${timeline}\nMessage: ${message}\nSource: ${source}`
      });
      console.log('Admin notification email sent');
    } catch (mailErr) {
      console.error('Email send failed (submission was saved):', mailErr.message);
    }
  } catch (err) {
    console.error('submit error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Test email endpoint (POST /api/test-email)
app.post('/api/test-email', async (req, res) => {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ ok: false, error: 'Missing "to" field' });
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
    const from = process.env.FROM_EMAIL || 'info@matsenseai.co.uk';
    await transporter.sendMail({
      from,
      to,
      subject: 'MatsenseAI — Test Email',
      text: 'This is a test email from MatsenseAI. If you received this, the email system is working correctly.\n\n— MatsenseAI'
    });
    console.log('Test email sent to', to);
    res.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (err) {
    console.error('Test email error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Admin auth: simple JWT
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';
  const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || null; // bcrypt hash

  if (username !== ADMIN_USER) return res.status(401).json({ ok: false });

  let ok = false;
  try {
    if (ADMIN_PASS_HASH && ADMIN_PASS_HASH.startsWith('$2')) {
      ok = await bcrypt.compare(password || '', ADMIN_PASS_HASH);
    } else {
      ok = password === ADMIN_PASS;
    }
  } catch (e) {
    ok = false;
  }

  if (ok) {
    const token = jwt.sign({ user: ADMIN_USER }, process.env.ADMIN_JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false });
});

// Protected submissions list
app.get('/admin/submissions', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'dev-secret');
  } catch (e) {
    return res.status(401).json({ ok: false });
  }
  if (DATABASE_URL.startsWith('postgres')) {
    db.query('SELECT * FROM submissions ORDER BY created_at DESC').then(r => res.json({ ok: true, rows: r.rows })).catch(err => res.status(500).json({ ok: false, error: err.message }));
  } else {
    const r = db.query('SELECT * FROM submissions ORDER BY created_at DESC');
    res.json({ ok: true, rows: r.rows });
  }
});

const PORT = process.env.PORT || 3000;

async function start() {
  await db.init();
  app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on http://0.0.0.0:${PORT}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
