const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ── Database (JSON file) ──────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db', 'database.json');
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { reports: [], officers: [], activity_log: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Seed officers
const db = readDB();
if (!db.officers || db.officers.length === 0) {
  db.officers = [
    { id: 'off-001', name: 'PC James Harper',    badge: 'MET-4421', unit: 'Traffic',    status: 'available', phone: '07700 900001' },
    { id: 'off-002', name: 'PC Sarah Chen',      badge: 'MET-4422', unit: 'Traffic',    status: 'available', phone: '07700 900002' },
    { id: 'off-003', name: 'Sgt David Okafor',   badge: 'MET-4430', unit: 'Response',   status: 'available', phone: '07700 900003' },
    { id: 'off-004', name: 'PC Emma Williams',   badge: 'MET-4415', unit: 'Highways',   status: 'on_duty',   phone: '07700 900004' },
    { id: 'off-005', name: 'Paramedic Unit 12',  badge: 'AMBU-012', unit: 'Ambulance',  status: 'available', phone: '07700 900005' },
    { id: 'off-006', name: 'Fire Engine FE-07',  badge: 'FIRE-007', unit: 'Fire',       status: 'available', phone: '07700 900006' },
  ];
  writeDB(db);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ── File Upload ───────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov/;
    cb(null, allowed.test(file.mimetype));
  }
});

// ── WebSocket broadcast ───────────────────────────────────────────────────────
function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'CONNECTED', payload: { message: 'RoadWatch live feed connected' } }));
});

// ── Save report as individual file ───────────────────────────────────────────
function saveReportFile(report) {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filename = `report-${report.id}-${report.created_at.replace(/[:.]/g, '-').slice(0, 19)}.json`;
  fs.writeFileSync(path.join(reportsDir, filename), JSON.stringify(report, null, 2));
}

// ── API ROUTES ────────────────────────────────────────────────────────────────

// Submit report
app.post('/api/reports', upload.array('images', 5), (req, res) => {
  try {
    const db = readDB();
    const {
      full_name, email, phone, issue_type, severity, description,
      road_name, postcode, latitude, longitude, anonymous
    } = req.body;

    if (!issue_type || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report = {
      id: uuidv4(),
      reference: `RW-${Date.now().toString(36).toUpperCase()}`,
      full_name: anonymous === 'true' ? 'Anonymous' : (full_name || 'Unknown'),
      email: anonymous === 'true' ? null : email,
      phone: anonymous === 'true' ? null : phone,
      anonymous: anonymous === 'true',
      issue_type,
      severity: severity || 'medium',
      description,
      road_name: road_name || 'Not specified',
      postcode: postcode || 'Not specified',
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null,
      images: (req.files || []).map(f => `/uploads/${f.filename}`),
      status: 'new',
      assigned_officer: null,
      assigned_unit: null,
      notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
    };

    db.reports.unshift(report);
    db.activity_log.unshift({
      id: uuidv4(),
      report_id: report.id,
      action: 'REPORT_SUBMITTED',
      detail: `New ${report.issue_type} report submitted by ${report.full_name}`,
      timestamp: new Date().toISOString()
    });
    writeDB(db);
    saveReportFile(report);
    broadcast('NEW_REPORT', report);

    res.json({ success: true, reference: report.reference, id: report.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reports (admin)
app.get('/api/reports', (req, res) => {
  const db = readDB();
  const { status, severity, type, search } = req.query;
  let reports = db.reports;
  if (status && status !== 'all') reports = reports.filter(r => r.status === status);
  if (severity && severity !== 'all') reports = reports.filter(r => r.severity === severity);
  if (type && type !== 'all') reports = reports.filter(r => r.issue_type === type);
  if (search) {
    const q = search.toLowerCase();
    reports = reports.filter(r =>
      r.reference.toLowerCase().includes(q) ||
      r.road_name.toLowerCase().includes(q) ||
      r.postcode.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }
  res.json(reports);
});

// Get single report
app.get('/api/reports/:id', (req, res) => {
  const db = readDB();
  const report = db.reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Not found' });
  res.json(report);
});

// Update report status / assign officer / add note
app.patch('/api/reports/:id', (req, res) => {
  const db = readDB();
  const idx = db.reports.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { status, assigned_officer, assigned_unit, note, admin_name } = req.body;
  const report = db.reports[idx];
  const prevStatus = report.status;

  if (status) report.status = status;
  if (assigned_officer !== undefined) report.assigned_officer = assigned_officer;
  if (assigned_unit !== undefined) report.assigned_unit = assigned_unit;
  if (note) {
    report.notes.push({
      id: uuidv4(),
      text: note,
      author: admin_name || 'Control Room',
      timestamp: new Date().toISOString()
    });
  }
  if (status === 'resolved') report.resolved_at = new Date().toISOString();
  report.updated_at = new Date().toISOString();

  db.reports[idx] = report;

  // Log activity
  const actions = [];
  if (status && status !== prevStatus) actions.push(`Status changed to ${status}`);
  if (assigned_officer) actions.push(`Assigned to ${assigned_officer}`);
  if (note) actions.push(`Note added`);

  if (actions.length) {
    db.activity_log.unshift({
      id: uuidv4(),
      report_id: report.id,
      action: 'REPORT_UPDATED',
      detail: actions.join(' | '),
      timestamp: new Date().toISOString()
    });
  }

  writeDB(db);
  saveReportFile(report);
  broadcast('REPORT_UPDATED', report);

  // Update officer status if assigned
  if (assigned_officer) {
    const offIdx = db.officers.findIndex(o => o.name === assigned_officer);
    if (offIdx !== -1) {
      db.officers[offIdx].status = 'on_duty';
      writeDB(db);
    }
  }

  res.json(report);
});

// Stats for dashboard
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const reports = db.reports;
  const now = Date.now();
  const last24h = reports.filter(r => now - new Date(r.created_at).getTime() < 86400000);

  res.json({
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    critical: reports.filter(r => r.severity === 'critical').length,
    last_24h: last24h.length,
    by_type: ['pothole', 'flooding', 'accident', 'obstruction', 'traffic_light', 'road_damage', 'other']
      .map(t => ({ type: t, count: reports.filter(r => r.issue_type === t).length })),
  });
});

// Officers
app.get('/api/officers', (req, res) => {
  const db = readDB();
  res.json(db.officers);
});

// Activity log
app.get('/api/activity', (req, res) => {
  const db = readDB();
  res.json(db.activity_log.slice(0, 50));
});

// List saved report files
app.get('/api/report-files', (req, res) => {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) return res.json([]);
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ filename: f, size: fs.statSync(path.join(reportsDir, f)).size }))
    .reverse();
  res.json(files);
});

// ── Pages ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚦 RoadWatch UK running at http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`📁 Reports saved to: ./reports/\n`);
});
