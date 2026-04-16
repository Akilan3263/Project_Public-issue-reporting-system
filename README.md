# 🚦 RoadWatch UK — Smart Road Issue Reporting System

A **full-stack, real-time road issue reporting platform** inspired by UK Government services.  
Designed to enable citizens to report road incidents while providing authorities with a **live control room dashboard**.

---

## 🌐 Overview

RoadWatch UK bridges the gap between the public and authorities by enabling:

- 📍 Real-time issue reporting  
- 🧠 Smart categorisation & severity tracking  
- 📊 Live monitoring dashboard for control rooms  
- 🚨 Emergency prioritisation system  

---

## 📸 Screenshots

### 🧾 Public Reporting Interface
![Public UI](https://github.com/user-attachments/assets/8567dce9-89c8-4966-87d8-632bc51a3b71)

### 🎛 Admin Control Room Dashboard
![Admin UI](https://github.com/user-attachments/assets/66d1c3e1-76bc-496f-8405-26f8d3c6265d)

---

## ✨ Key Features

### 👤 Public Side
- GOV.UK-style multi-step reporting form  
- GPS-based location detection  
- Reverse geocoding (road name & postcode)  
- Upload images/videos (drag & drop)  
- Issue categorisation (pothole, accident, flooding, etc.)  
- Severity selection (Low → Critical)  
- Anonymous reporting option  
- Reference number generation  

---

### 🛠 Admin Dashboard (Control Room)
- ⚡ Real-time updates using WebSockets  
- 📊 KPI cards (Total, In Progress, Critical, etc.)  
- 🔎 Advanced filtering & search  
- 🧾 Detailed report view with:
  - Status updates  
  - Officer assignment  
  - Notes system  
- 📡 Live activity log  
- 🗺 Map-based report tracking  
- 🚨 Critical alert prioritisation  

---

## 🏗 System Architecture

```text
Public UI (HTML/CSS/JS)
        ↓
Express Server (Node.js)
        ↓
JSON Database (File Storage)
        ↓
Admin Dashboard (WebSocket Live Updates)

| Layer       | Technology            |
| ----------- | --------------------- |
| Frontend    | HTML, CSS, JavaScript |
| Backend     | Node.js, Express.js   |
| Real-time   | WebSocket (`ws`)      |
| Storage     | JSON-based DB         |
| File Upload | Multer                |
| Security    | Helmet, Rate Limiting |
| Maps        | OpenStreetMap         |



⚙️ Installation & Setup
git clone https://github.com/Akilan3263/Project_Public-issue-reporting-system.git
cd Project_Public-issue-reporting-system
npm install
node server.js


🚀 Usage
Interface	URL
Public Reporting	http://localhost:3000
Admin Dashboard	http://localhost:3000/admin


📁 Project Structure
roadwatch/
├── admin/              # Admin dashboard UI
├── public/             # Public reporting UI
├── db/                 # Database folder
├── server.js           # Backend server
├── package.json        # Dependencies
├── .gitignore
└── README.md


🔐 Future Enhancements
🔑 Admin authentication system
☁️ Cloud database (MongoDB / Firebase)
📱 Mobile responsive optimisation
🤖 AI-based issue classification
🎤 Voice-based reporting
🌍 Multi-language support


📌 Use Cases
Smart City infrastructure
Government civic reporting systems
Traffic management authorities
Emergency response coordination


👨‍💻 Author
Akilan JD
🎓 MSc Artificial Intelligence — Brunel University London
🔗 GitHub: https://github.com/Akilan3263
💼 LinkedIn: https://www.linkedin.com/in/akilan-jd/
