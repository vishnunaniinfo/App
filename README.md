
# Xavira Lead Engine

<p align="center">
  <img src="https://dummyimage.com/600x160/000/fff&text=Xavira+Tech+Labs" width="600" />
</p>

A complete enterprise-grade lead management and WhatsApp automation platform designed for real-estate builders, agencies, and marketing firms.  
Built by **Vishnu Vardhan Burri**, Founder & CEO, Xavira Tech Labs.

---

## About the Platform

Xavira Lead Engine provides unified lead management, automated WhatsApp communication, project management, agent performance tracking, analytics dashboards, and enterprise-ready security.  
It powers high-volume real estate operations with modern, scalable architecture.

---

## System Architecture

### High-Level Architecture Diagram

```

```
                ┌─────────────────────────────┐
                │         Frontend             │
                │   React 19 + Vite + TS       │
                └─────────────┬───────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │        API Gateway       │
                 │  Node.js + Express + TS  │
                 └────────────┬─────────────┘
                              │
   ┌──────────────────────────┼──────────────────────────┐
   ▼                          ▼                          ▼
```

┌──────────────┐        ┌────────────────┐         ┌───────────────────┐
│ PostgreSQL   │        │ Redis (Cache) │         │ Redis (BullMQ)     │
│ Lead/Users   │        │ Sessions      │         │ Queues/Automation  │
└──────────────┘        └────────────────┘         └───────────────────┘

```
                              │
                              ▼
                   ┌──────────────────────┐
                   │ WhatsApp Providers   │
                   │ Twilio / UltraMsg    │
                   └──────────────────────┘
```

```

---

## Features

### Lead Management
- Multi-channel lead capture (API, forms, integrations)
- Deduplication with normalized phone numbers
- Lead scoring and qualification
- Pipeline stages with drag-and-drop interface
- Full activity timeline with interaction logs
- Lead assignment and agent workload system

### WhatsApp Automation Engine
- Multi-provider architecture
- Message templates with dynamic variables
- Follow-up sequences (0h, 24h, 72h)
- Delivery status tracking
- Inbound message processing
- Business hours compliant scheduling

### Dashboard & Analytics
- Interactive KPI dashboard
- Lead source analytics
- Agent performance charts
- Pipeline metrics
- Response time analytics
- Exportable reports

### Security
- JWT authentication with refresh rotation
- Role-based access control
- Rate-limiting per route and per IP
- SQL-injection safe ORM (Prisma)
- Audit logging
- GDPR-compliant data handling

### Infrastructure
- Dockerized architecture
- nginx reverse proxy
- Database migrations and schema versioning
- Full CI/CD readiness

---

## Technology Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL database
- Redis (Cache, Sessions, Queues)
- BullMQ

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Query

### Deployment
- Docker & Docker Compose
- nginx for production
- Environment-based config system

---

## Screenshot Layout (Placeholder)

```

[ Dashboard Screenshot ]
[ Pipeline Screenshot ]
[ WhatsApp Automation Builder ]
[ Team Performance Dashboard ]

````

---

## Quick Start

### Development
```bash
docker-compose up -d
````

### Backend Only

```bash
cd backend
npm install
npm run dev
```

### Frontend Only

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
backend/
  src/
    routes/
    middleware/
    prisma/
    queues/
    modules/
frontend/
  src/
    components/
    pages/
    hooks/
    services/
docker/
docs/
```

---

## Deployment (Production)

```bash
docker-compose -f docker-compose.yml up --build
```

---

## Author

**Vishnu Vardhan Burri**
Founder & CEO – Xavira Tech Labs
LinkedIn: [https://www.linkedin.com/in/vishnu-vardhan-burri](https://www.linkedin.com/in/vishnu-vardhan-burri)

---

## License

Copyright ©
Xavira Tech Labs
Proprietary License

````

---

# **2. GitHub Wiki Documentation Set**  
Create these files inside GitHub Wiki.

---

### **Home.md**

```md
# Xavira Lead Engine Documentation

Welcome to the official documentation for the Xavira Lead Engine.

## Sections
- [System Overview](System-Overview.md)
- [Architecture](Architecture.md)
- [API Guide](API.md)
- [Frontend Guide](Frontend.md)
- [Backend Modules](Backend.md)
- [Deployment Guide](Deployment.md)
- [Security](Security.md)
- [Database Schema](Database-Schema.md)
````

---

### **System-Overview.md**

```md
# System Overview

Xavira Lead Engine is an enterprise-grade platform for real estate lead management with WhatsApp automation and CRM features.

## Key Capabilities
- Lead Management
- WhatsApp Automation
- Team Collaboration
- Dashboards and Analytics
- Project and Agent Management
- Enterprise Security
```

---

### **Architecture.md**

```md
# Architecture

The system follows a modular microservice-friendly structure with a monorepo layout.

## Components
- Frontend (React)
- Backend API (Node.js)
- PostgreSQL
- Redis Cache
- Redis Queue System (BullMQ)
- WhatsApp Provider Layer
- nginx Reverse Proxy

```

---

### **API.md**

```md
# API Guide

Base URL: `/api`

## Sections
- Authentication
- Leads
- WhatsApp
- Automation
- Projects
- Users
- Dashboard
```

---

### **Backend.md**

```md
# Backend Architecture

## Modules
- Auth Module
- User Module
- Lead Module
- WhatsApp Module
- Automation Module
- Project Module
- Dashboard Module

## Libraries
- Express.js
- Prisma ORM
- Zod Validation
- BullMQ
- Redis
```

---

### **Frontend.md**

```md
# Frontend Architecture

## Technology
- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Query

## Structure
- Components
- Pages
- Services
- Hooks
```

---

### **Deployment.md**

````md
# Deployment Guide

## Development
```bash
docker-compose up -d
````

## Production

```bash
docker-compose -f docker-compose.yml up --build
```

## nginx Setup

Included in `docker/nginx.conf`

````

---

### **Security.md**

```md
# Security

- JWT authentication
- Rate limiting
- Role-based access control
- Audit logs
- SQL injection safe queries
- Data encryption policies
- GDPR compliant
````

---

### **Database-Schema.md**

```md
# Database Schema

Includes Entity-Relationship documentation for:
- Users
- Leads
- Projects
- Message Templates
- Automation Sequences
- Message Logs
- Activities
```

---

# **3. Full API Reference README**

```md
# API Reference

Base URL (Development)
```

[http://localhost:3001/api](http://localhost:3001/api)

````

---

## Authentication

### POST /auth/login
Request:
```json
{
  "email": "admin@example.com",
  "password": "password"
}
````

Response:

```json
{
  "token": "",
  "refreshToken": ""
}
```

---

## Leads

### POST /public/webhook/lead

```json
{
  "name": "Ravi",
  "phone": "+919876543210",
  "project": "Sunrise",
  "source": "facebook"
}
```

### GET /leads

Pagination + search supported.

### PATCH /leads/:id

### DELETE /leads/:id

---

## WhatsApp Messaging

### POST /whatsapp/send

```json
{
  "phone": "+919876543210",
  "templateId": "welcome"
}
```

---

## Automation Sequences

### POST /automation/sequence

### GET /automation/sequence

---

## Projects

### GET /projects

### POST /projects

---

## Users

### GET /users

### POST /users

---

## Dashboard

### GET /dashboard/summary

---

# **4. Landing Page-Style README**

````md
# Xavira Lead Engine  
Enterprise Lead Management and WhatsApp Automation System

## Built For
Builders, real estate agencies, property developers, and marketing firms who need a scalable, automated CRM.

## Highlights
- Lead capture from multiple channels
- WhatsApp automation engine with templates and sequences
- Team and agent management
- Real-time dashboard analytics
- Enterprise security and role-based access

## Technology
- Node.js + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- React 19 + Vite
- Tailwind CSS
- Docker & Production Deployment

## Live Architecture Diagram
(Placeholder for uploaded image)

## Get Started
```bash
docker-compose up -d
````

Frontend:

```
http://localhost:3000
```

Backend:

```
http://localhost:3001
```

## Author

Vishnu Vardhan Burri
Founder & CEO — Xavira Tech Labs

```

