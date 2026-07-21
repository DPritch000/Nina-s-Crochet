require('dotenv').config();

const express    = require('express');
const path       = require('path');
const multer     = require('multer');
const nodemailer = require('nodemailer');
const session    = require('express-session');

const authRoutes  = require('./server/authRoutes');
const postsRoutes = require('./server/postsRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── File upload (memory storage – attach directly to email) ──────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ── Nodemailer transporter (lazy – reads env vars at request time) ──────────
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'Client')));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sessions ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 4 * 60 * 60 * 1000   // 4 hours
  }
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/admin', authRoutes);
app.use('/api/posts', postsRoutes);

// ── Custom Order endpoint ─────────────────────────────────────────────────────
app.post('/api/custom-order', upload.single('referenceImage'), async (req, res) => {
  const { name, email, phone, textOk, address, message } = req.body;

  // Server-side validation of required fields
  if (!name || !email || !address) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const textLine = textOk === 'on' ? 'Yes' : 'No';

  const mailOptions = {
    from: `"Nina's Crochet Site" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    replyTo: email,
    subject: `New Custom Order Request from ${name}`,
    html: `
      <h2 style="font-family:sans-serif;color:#c0425d;">New Custom Order Request</h2>
      <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;">
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Name</td><td>${name}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Phone</td><td>${phone || '—'}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Text OK?</td><td>${textLine}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Address</td><td>${address}</td></tr>
        <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Message</td><td>${message || '—'}</td></tr>
      </table>
    `
  };

  // Attach reference image if provided
  if (req.file) {
    mailOptions.attachments = [{
      filename: req.file.originalname,
      content: req.file.buffer,
      contentType: req.file.mimetype
    }];
  }

  try {
    await createTransporter().sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: err.message || 'Failed to send email. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Nina's Crochet is running on port ${PORT}`);
});
