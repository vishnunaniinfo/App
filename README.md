


```md
<p align="center">
  <img src="https://via.placeholder.com/220x60?text=Xavira+Tech+Labs" alt="Xavira Logo"/>
</p>

<h1 align="center">🚀 Xavira Lead Engine</h1>
<h3 align="center">Enterprise Real Estate Lead Management + WhatsApp Automation</h3>

<p align="center">
  Built by <b>Vishnu Vardhan Burri</b><br/>
  Founder & CEO — <b>Xavira Tech Labs</b>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Redis-7-red?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Production-Ready-success?style=for-the-badge"/>
</p>

---

## 📸 Product Screenshots

> *(Replace with real images later — placeholders added)*

### **Dashboard**
<p align="center">
  <img src="https://via.placeholder.com/1200x600?text=Dashboard+Preview" />
</p>

### **Lead Management**
<p align="center">
  <img src="https://via.placeholder.com/1200x600?text=Lead+Management+UI" />
</p>

### **WhatsApp Automation**
<p align="center">
  <img src="https://via.placeholder.com/1200x600?text=WhatsApp+Automation+Flow" />
</p>

---

## 🎬 Demo (GIF Preview)
<p align="center">
  <img src="https://via.placeholder.com/900x500?text=Demo+GIF+Placeholder" />
</p>

---

# 🚀 Overview

**Xavira Lead Engine** is a complete enterprise SaaS platform built for real-estate companies, brokers, and marketing teams.

It includes:

- Lead management  
- WhatsApp automation  
- Sales pipeline  
- Agent performance analytics  
- Automation workflows  
- Complete API ecosystem  

This is a fully scalable, production-grade system following modern industry standards.

---

# ✨ Features

## 🏗 Core Modules

### **Lead Management**
- Multi-channel lead capture (webhooks, forms, imports)
- Duplicate prevention with phone-number matching
- Lead scoring + qualification logic
- Timeline activity history
- Drag-and-drop pipeline

### **WhatsApp Automation**
- Multi-provider support: Twilio, UltraMsg, Mock
- Template messages with dynamic variables
- Scheduled message sequences (0h / 24h / 48h / 72h)
- Business-hours filtering
- Auto-update lead stage from replies
- Delivery tracking + retry engine

### **Team Collaboration**
- Roles: Admin, Manager, Agent
- Lead assignment rules
- Agent performance insights
- Secure audit logging

### **Dashboard & Analytics**
- Total leads, conversions, revenue potential
- Source-wise breakdown
- Performance heatmaps
- Export to CSV/PDF

---

# 🧱 Architecture

### **Backend**
- Node.js + Express  
- TypeScript  
- Prisma ORM  
- PostgreSQL  
- Redis (cache + queues)  
- BullMQ for automation jobs  
- JWT Auth  

### **Frontend**
- React 19  
- Vite  
- Tailwind CSS  
- React Query  
- Recharts  

### **DevOps**
- Docker  
- Nginx reverse proxy  
- Production builds  
- CI/CD ready  

---

# 📦 Folder Structure

```

backend/
src/
prisma/
routes/
queues/
utils/

frontend/
src/
components/
pages/
hooks/

docker/
docs/
scripts/

````

---

# ⚙️ Installation

## **1️⃣ Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
````

## **2️⃣ Start All Services via Docker**

```bash
docker-compose up -d
```

Services:

| Service      | URL                                                              |
| ------------ | ---------------------------------------------------------------- |
| Frontend     | [http://localhost:3000](http://localhost:3000)                   |
| Backend API  | [http://localhost:3001](http://localhost:3001)                   |
| Swagger Docs | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) |
| PostgreSQL   | :5432                                                            |
| Redis        | :6379                                                            |

---

# 🛠 Development Mode

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🧪 Quick API Test

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Public Lead Webhook

```bash
curl -X POST http://localhost:3001/api/public/webhook/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Ravi","phone":"+919876543210","project":"SkyView","source":"facebook"}'
```

---

# 🔐 Security

* JWT + refresh tokens
* Role-based access
* Rate limiting
* Sanitized inputs
* Prisma ORM (SQL injection safe)
* CORS protection
* Audit logs

---

# 🚀 Production Deployment

### Build

```bash
docker-compose -f docker-compose.yml up --build
```

### Verify

```bash
curl http://localhost:3001/api/health
```

---

# 👤 Author

**Vishnu Vardhan Burri**
Founder & CEO — **Xavira Tech Labs**
🌐 [https://www.linkedin.com/in/vishnu-vardhan-burri/](https://www.linkedin.com/in/vishnu-vardhan-burri/)

---

# 🏢 Xavira Tech Labs

We build automation-first SaaS systems for real estate, finance, and enterprise workflows.
For consulting or enterprise deployment — **contact us anytime.**

---

# 📄 License

Proprietary — © Xavira Tech Labs.
All rights reserved.



