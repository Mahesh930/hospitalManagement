# MediCore Hospital ERP — Docker Deployment Guide

This document provides complete instructions on containerizing, running, and managing the **MediCore Hospital ERP** system using Docker and Docker Compose under a **Single Link** (single domain / IP) with automatic role-based dashboard redirection.

---

## 1. Single Link Architecture (Nginx Reverse Proxy Gateway)

In single-link deployment, clients only ever connect to **one URL** (e.g. `http://hospital.example.com` or `http://localhost`). An Nginx reverse proxy gateway container terminates incoming requests and routes them internally:

```
                               +----------------------------+
                               |     Client / Browser       |
                               |    (Single URL / Port 80)  |
                               +--------------+-------------+
                                              |
                                              | HTTP / Port 80
                                              v
                               +----------------------------+
                               |      medicore-gateway      |
                               |       (Nginx Alpine)       |
                               +--------------+-------------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
        Location /api/v1/ (REST API)                        Location / (Web UI)
                       |                                             |
                       v                                             v
           +------------------------+                    +------------------------+
           |    medicore-backend    |                    |   medicore-frontend    |
           |  (Spring Boot Java 17) |                    |    (Next.js 15 Web)    |
           |   Internal Port 8080   |                    |   Internal Port 3000   |
           +-----------+------------+                    +------------------------+
                       |
                       | Internal Port 5432
                       v
           +------------------------+
           |   medicore-postgres    |
           |    (PostgreSQL 16)     |
           |   Internal Port 5432   |
           +-----------+------------+
                       |
                       v
              postgres_data (Volume)
```

### Why Single Link is Superior:
1. **Zero CORS Issues**: Both frontend assets and REST API requests are served from the identical origin (`http://your-domain/`).
2. **Simplified User Experience**: Staff and patients don't have to remember different ports like `:8080` or `:3000`.
3. **Hardened Security**: The backend database and internal ports do not need to be exposed directly to the outside internet.
4. **SSL/TLS Ready**: Easily configure HTTPS certificates (Let's Encrypt / Certbot) on the Nginx gateway in one place.

---

## 2. Containerized Services Summary

| Service | Container Name | Technology | Internal Port | Exposed Port | Role in System |
|---|---|---|---|---|---|
| **gateway** | `medicore-gateway` | Nginx Alpine | 80 | **`80:80`** | Single public entrypoint reverse proxy |
| **frontend** | `medicore-frontend` | Node.js 20 Alpine | 3000 | `3000` | Next.js 15 hospital UI & role dashboards |
| **backend** | `medicore-backend` | Eclipse Temurin 17 JRE | 8080 | `8080` | Multi-module Spring Boot REST API |
| **postgres** | `medicore-postgres` | PostgreSQL 16 Alpine | 5432 | `5432` | Relational database with persistent volume |

---

## 3. How Role-Based Dashboard Redirection Works

When deployed under a single link:

1. **User visits Single Link**: e.g. `http://hospital.example.com` (or `http://localhost`).
2. **Redirect to Login**: Unauthenticated visitors are automatically routed to `/login`.
3. **Authentication**: The user enters their username and password. The request hits `/api/v1/auth/login`.
4. **JWT & Roles Stored**: The backend returns the JWT token along with the user's assigned role(s) (e.g. `DOCTOR`, `NURSE`, `PHARMACIST`, `CASHIER`, `LAB_TECH`, `RECEPTIONIST`, `PATIENT`, `ADMIN`, `SUPER_ADMIN`).
5. **Dashboard Station Matching**: The browser redirects to `/dashboard`. In `apps/web-admin/src/app/(dashboard)/dashboard/page.tsx`, the application inspects the user's role and renders their station:

```
+--------------------+---------------------------------------------------------------+
| User Role          | Rendered Dashboard Station                                    |
+--------------------+---------------------------------------------------------------+
| DOCTOR             | DoctorDashboard: Live OPD queue, active consults, e-Rx        |
| NURSE              | NurseDashboard: Inpatient bed allocation, eMAR, vitals        |
| PHARMACIST         | PharmacyDashboard: FEFO dispensing queue, stock, batches      |
| RECEPTIONIST       | ReceptionistDashboard: Registration, token & queue manager    |
| CASHIER            | CashierDashboard: Invoicing, payments, daily revenue stats    |
| LAB_TECH           | LabDashboard: Diagnostic worklist, sample collection, results |
| PATIENT            | PatientDashboard: Personal medical history, appointments      |
| ADMIN              | AdminDashboard: Hospital stats, master data, staff config     |
| SUPER_ADMIN        | SuperAdminDashboard: Multi-tenant hospitals & platform stats  |
+--------------------+---------------------------------------------------------------+
```

6. **Sidebar Navigation**: `apps/web-admin/src/app/(dashboard)/layout.tsx` automatically filters the left sidebar menu to only display the screens permitted for that specific role.

---

## 4. Quick Start Commands

### A. Run Entire System with Single Link Gateway
From the project root directory:

```powershell
docker-compose up --build -d
```

### B. Verify Running Containers
```powershell
docker-compose ps
```

All 4 services will show `Up`:
- `medicore-gateway` (Up on port 80)
- `medicore-frontend` (Up on port 3000)
- `medicore-backend` (Up on port 8080)
- `medicore-postgres` (healthy on port 5432)

### C. Access Single Link in Your Browser
Open your browser and navigate to:

👉 **[http://localhost](http://localhost)** *(or your server's public IP / domain)*

You will immediately see the MediCore ERP login page.

---

## 5. Seeded Role Accounts (Password for all: `Password@123`)

Log in using any of the accounts below to test role redirection:

| Role | Username | Test Redirection Station |
|---|---|---|
| **DOCTOR** | `doctor` | Doctor OPD Queue & Consultation |
| **NURSE** | `nurse` | Inpatient Beds, Vitals & eMAR |
| **RECEPTIONIST** | `receptionist` | Patient Registration & Tokens |
| **PHARMACIST** | `pharmacist` | Drug Batches & FEFO Dispense |
| **CASHIER** | `cashier` | Invoice Collection & Receipts |
| **LAB_TECH** | `labtech` | Lab Tests Worklist & Results |
| **PATIENT** | `patient` | Personal Portal & Appointments |
| **ADMIN** | `admin` | Department & Staff Management |
| **SUPER_ADMIN** | `superadmin` | Tenant & Hospital Onboarding |

---

## 6. Production Cloud Deployment (VPS / EC2 / DigitalOcean)

To deploy on a live production server with your own domain (e.g., `hospital.yourdomain.com`):

1. **Point DNS**: Add an `A` record in your DNS provider:
   - `Type`: `A`
   - `Name`: `hospital` (or `@`)
   - `Value`: `YOUR_SERVER_PUBLIC_IP`
2. **Clone & Launch**:
   ```bash
   git clone <repo-url> /var/www/medicore
   cd /var/www/medicore
   docker-compose up --build -d
   ```
3. **Enable Free HTTPS/SSL via Certbot**:
   Run Certbot on the host or inside a container to get a Let's Encrypt SSL certificate for port `443`.
