# 🚦 RoadWatch UK — Road Issue Reporting System

A full-stack UK Government-style road issue reporting portal with a real-time control room admin dashboard.

---

## Features

### Public Report Form
- GOV.UK-style design with step-by-step form wizard (6 steps)
- **Automatic GPS location detection** via browser geolocation API
- Reverse geocoding (auto-fills road name & postcode from GPS)
- Map preview using OpenStreetMap
- Photo/video upload (up to 5 files, drag & drop)
- Issue type selector (pothole, flooding, accident, obstruction, traffic light, road damage, debris, other)
- Severity rating (low / medium / high / critical)
- Anonymous reporting toggle
- Form validation with GOV.UK-style error messages
- Reference number confirmation

### Admin Control Room Dashboard
- **Real-time updates** via WebSocket (no page refresh needed)
- Live notification banner when new reports arrive
- Live ticker feed at the bottom
- Stats overview: total, new, in progress, resolved, critical, last 24h
- Reports by type chart
- Full reports table with filtering by status, severity, type
- Search by reference, road, postcode, description
- **Report detail modal** with full control room actions:
  - Update status (new → in_progress → resolved → closed)
  - Assign officer or emergency unit
  - Add notes to the record
  - View uploaded images (lightbox)
  - GPS coordinates with OpenStreetMap link
- Officers & units panel (Traffic, Response, Highways, Ambulance, Fire)
- Activity log
- Map view page
- Saved report files viewer

### Data & Storage
- All reports saved to `./db/database.json`
- Every individual report also saved as a separate JSON file in `./reports/`
- Uploaded images stored in `./uploads/`

---

## How to Run

### Prerequisites
- **Node.js** version 16 or higher — download from https://nodejs.org
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Step 1 — Download / unzip the project
Place the `roadwatch` folder somewhere on your computer, e.g. your Desktop.

### Step 2 — Open a terminal / command prompt
- **Windows**: Press `Win + R`, type `cmd`, press Enter. Or right-click the folder → "Open in Terminal"
- **Mac**: Open Terminal from Applications → Utilities
- **Linux**: Open your terminal emulator

### Step 3 — Navigate to the project folder
```bash
cd path/to/roadwatch
# Example Windows: cd C:\Users\YourName\Desktop\roadwatch
# Example Mac/Linux: cd ~/Desktop/roadwatch
```

### Step 4 — Install dependencies
```bash
npm install
```
This downloads all required packages (takes ~30 seconds the first time).

### Step 5 — Start the server
```bash
node server.js
```
You should see:
```
🚦 RoadWatch UK running at http://localhost:3000
📊 Admin Dashboard: http://localhost:3000/admin
📁 Reports saved to: ./reports/
```

### Step 6 — Open in browser
| Page | URL |
|------|-----|
| Public report form | http://localhost:3000 |
| Admin dashboard | http://localhost:3000/admin |

---

## Testing End-to-End

1. Open **http://localhost:3000** in your browser
2. Fill in the form:
   - Select an issue type (e.g. Pothole)
   - Select severity (e.g. High)
   - Allow location access when prompted, or enter a postcode manually
   - Enter a road name and postcode
   - Write a description
   - Add your name/email (or toggle anonymous)
   - Optionally upload a photo
   - Review and submit
3. Note your **reference number** (e.g. `RW-M7X2KC4`)
4. Open **http://localhost:3000/admin** in another tab
5. You should see the report appear immediately in the dashboard
6. Click the report to open the detail modal
7. Assign an officer, add a note, change status to "In Progress" or "Resolved"
8. Click "Save Changes"
9. Check the `./reports/` folder — each report is saved as a JSON file

---

## Folder Structure

```
roadwatch/
├── server.js          ← Main Node.js/Express server
├── package.json       ← Dependencies
├── public/
│   └── index.html     ← Public report submission form
├── admin/
│   └── index.html     ← Admin control room dashboard
├── db/
│   └── database.json  ← Live database (auto-created)
├── reports/           ← Individual saved report JSON files (auto-created)
└── uploads/           ← Uploaded images (auto-created)
```

---

## Deploying to the Internet

### Option A: Railway (easiest, free)
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub"
3. Push this folder to a GitHub repo first, then connect it
4. Railway auto-detects Node.js and runs `node server.js`

### Option B: Render (free)
1. Go to https://render.com
2. New → Web Service → connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`

### Option C: VPS (DigitalOcean, Hetzner, etc.)
```bash
# On your server:
git clone <your-repo>
cd roadwatch
npm install
# Install PM2 to keep it running:
npm install -g pm2
pm2 start server.js --name roadwatch
pm2 startup  # auto-restart on reboot
```

---

## Notes
- Location detection requires HTTPS in production (browsers restrict geolocation on HTTP)
- For local testing, `localhost` works fine without HTTPS
- The WebSocket connection auto-reconnects if dropped
- Reports persist between server restarts (stored in JSON files)
