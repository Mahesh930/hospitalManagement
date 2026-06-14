# Hospital Management System - Backend

A robust, enterprise-grade backend application for a Hospital Management System built using **Spring Boot 3**. This project features a comprehensive architecture for managing doctors, patients, and appointments, with a strong focus on security and modern development practices.

## 🚀 Features

- **User Authentication & Authorization**:
    - **JWT-based Security**: Stateless authentication using JSON Web Tokens.
    - **OAuth2 Integration**: Support for social login (e.g., Google) with automatic account creation.
    - **Role-Based Access Control (RBAC)**: Fine-grained permissions for `ADMIN`, `DOCTOR`, and `PATIENT`.
- **Doctor Management**:
    - Onboarding flow for new doctors by administrators.
    - Specialization tracking and appointment scheduling.
- **Patient Management**:
    - Profile management and insurance association.
    - View personal medical history and upcoming appointments.
- **Appointment System**:
    - Seamless booking process for patients.
    - Appointment reassignment capabilities for administrators.
    - View-only access for doctors to manage their daily schedules.
- **Advanced Database Queries**:
    - Optimized JPA queries with `JOIN FETCH` to avoid N+1 problems.
    - Custom statistics (e.g., blood group distribution) using JPQL and native SQL.
- **Global Error Handling**:
    - Centralized exception management for consistent API responses.

## 🛠️ Tech Stack

- **Backend**: Java 21, Spring Boot 3.5
- **Security**: Spring Security (JWT, OAuth2)
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Mapping**: ModelMapper
- **Tooling**: Lombok, Maven

## 📂 Project Structure

```text
src/main/java/com/mahesh/hospitalManagement/
├── config/             # Application & ModelMapper configurations
├── controller/         # REST Controllers (Admin, Auth, Doctor, Patient, Public)
├── dto/                # Data Transfer Objects for API requests/responses
├── entity/             # JPA Entities and Enumerations
├── error/              # Global Exception Handling & API Error models
├── repository/         # JPA Repositories with custom queries
├── security/           # JWT Filters, OAuth2 Handlers, and Security Config
└── service/            # Business Logic implementation
```

## 🔐 API Endpoints (Summary)

### Public Endpoints
- `POST /auth/signup`: Register a new user/patient.
- `POST /auth/login`: Authenticate and receive a JWT token.
- `GET /public/doctors`: View all available doctors.

### Patient Endpoints (Requires ROLE_PATIENT)
- `GET /patients/profile`: View personal profile.
- `POST /patients/appointments`: Book a new appointment.

### Doctor Endpoints (Requires ROLE_DOCTOR)
- `GET /doctors/appointments`: View all assigned appointments.

### Admin Endpoints (Requires ROLE_ADMIN)
- `POST /admin/onBoardNewDoctor`: Convert a user into a doctor profile.
- `GET /admin/patients`: View paginated list of all patients.

## 🛠️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```
2. **Database Configuration**:
   Update `src/main/resources/application.properties` or `application.yml` with your PostgreSQL credentials.
3. **Build the project**:
   ```bash
   mvn clean install
   ```
4. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

## 📝 Future Enhancements
- Integration with an email service for appointment reminders.
- Implementation of a Prescription management system.
- Addition of a Tele-medicine module with video calling capabilities.
