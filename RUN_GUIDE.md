# How to Run Hospital Management System (Medicore ERP)

This guide provides step-by-step instructions to set up, configure, and run both the **Spring Boot Backend** and **Next.js Frontend** applications.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:

| Dependency | Minimum Version | Required For |
| :--- | :--- | :--- |
| **Java JDK** | Java 17+ | Backend Service |
| **PostgreSQL** | PostgreSQL 13+ | Database |
| **Node.js** | Node 18+ | Frontend Monorepo |
| **pnpm** | pnpm 9+ / 10+ | Frontend Package Manager |

---

## 🗄️ Step 1: Database Setup (PostgreSQL)

1. Ensure PostgreSQL service is running on `localhost:5432`.
2. Open **pgAdmin** or PostgreSQL CLI (`psql`) and create a database named `hospital`:

```sql
CREATE DATABASE hospital;
```

3. Configure database credentials in `src/main/resources/application.properties` (if different from default):

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/hospital
spring.datasource.username=postgres
spring.datasource.password=root
```

---

## ⚙️ Step 2: Run Backend Service (Spring Boot)

Open a terminal in the root directory of the project (`d:\Java Spring\hospitalManagement`):

### Option A: Run directly using Maven Wrapper (Recommended for Dev)

First, build & install submodules to local repo (one-time or after module changes):
```powershell
.\mvnw.cmd install -DskipTests
```

Then run the executable application module:
```powershell
.\mvnw.cmd spring-boot:run -pl backend/hospital-app
```

**Linux / macOS:**
```bash
./mvnw install -DskipTests
./mvnw spring-boot:run -pl backend/hospital-app
```

### Option B: Build Monorepo JAR and Run

```powershell
.\mvnw.cmd clean package -DskipTests
java -jar backend/hospital-app/target/hospital-app-0.0.1-SNAPSHOT.jar
```

* **Backend Base URL:** `http://localhost:8080`
* **API Endpoints Prefix:** `http://localhost:8080/api/v1`

---

## 🌐 Step 3: Run Frontend Application (Next.js Monorepo)

Open a **new terminal window** and navigate to the `frontend/` folder:

```powershell
cd frontend
```

### 1. Install Dependencies

```powershell
pnpm install
```

### 2. Configure Environment Variables (Optional)

If your backend is running on a custom host/port, create a `.env.local` file inside `frontend/apps/admin-web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

*(If omitted, it defaults to `http://localhost:8080/api/v1`)*

### 3. Start Development Server

```powershell
pnpm dev
```

* **Admin Portal URL:** `http://localhost:3000`

---

## 🚀 Summary of Ports & Services

| Service | Port | Base URL / Path |
| :--- | :--- | :--- |
| **PostgreSQL Database** | `5432` | `jdbc:postgresql://localhost:5432/hospital` |
| **Spring Boot Backend** | `8080` | `http://localhost:8080/api/v1` |
| **Next.js Admin Web** | `3000` | `http://localhost:3000` |

---

## 🛠️ Verification Checklist

1. **Check Backend Health**: Open browser at `http://localhost:8080/api/v1/auth/me` or any API route.
2. **Check Frontend**: Open `http://localhost:3000` in browser.
