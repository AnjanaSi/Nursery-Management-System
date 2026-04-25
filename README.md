# 🌱 Merry Kids Nursery Management System

A full-stack web-based Nursery Management and Information System developed for **Merry Kids International Montessori**.
The system combines a **public-facing nursery website** with a **secure role-based portal** for administrators, teachers, and parents.

Because nursery children are too young to use a portal independently, **parents and guardians act as the effective end users** of all child-facing functions.

---

## 📖 Features

### Public Website
- Home, About, Programs, Gallery, Events, and Contact sections
- Online admissions page with application form and document upload
- All public content managed dynamically via the admin CMS

### Admin Portal
- Admissions management (review and update application status)
- Staff management (CRUD, photo upload, account provisioning)
- Student management (CRUD, guardian linking, year promotion, parent account provisioning)
- Admin profile management with self-lockout and last-admin protection
- Public site CMS (About, Programs, Gallery, Events, Contact)

### Teacher Portal
- Create, edit, archive, and delete announcements and homework content
- Attach files to content (PDF, DOCX, images; 10 MB per file)
- View own teacher profile

### Parent Portal
- Switch between multiple active children (multi-child household support)
- View level-appropriate announcements and homework
- Viewed/unviewed tracking — content resurfaces as "NEW" if edited after being read
- Secure attachment downloads
- View child profile details

### Authentication & Security
- JWT-based stateless authentication with role-based access control
- BCrypt password hashing
- Admin-controlled account provisioning (no open self-registration)
- Forced password change on first login
- Email-based forgot/reset password flow (secure single-use token)

---

## 🏗 Architecture

The system follows a layered full-stack architecture:

- **Public Website Layer** — Static-style public site with CMS-backed content
- **Secure Portal Layer** — Role-specific dashboards (Admin, Teacher, Parent)
- **Backend** — Spring Boot REST API with service/repository separation
- **Database** — MySQL with Spring Data JPA
- **Supporting Services** — Local file storage and SMTP email integration

---

## ⚙️ Technologies

**Frontend**
- React 19 / Vite 7 / JavaScript
- Bootstrap 5 / React Router / Axios

**Backend**
- Java 21 / Spring Boot 3.5 / Maven
- Spring Security / Spring Data JPA / Spring Mail

**Database & Other**
- MySQL
- JWT / BCrypt
- Local file storage / SMTP email

---

## 📂 Key Components

| Component | Description |
|---|---|
| `SecurityConfig` | Public vs. secured endpoint rules, CORS, stateless session |
| `JwtAuthenticationFilter` | Validates JWT and injects security context |
| `MustChangePasswordFilter` | Blocks non-auth endpoints until password is changed |
| `AuthService` | Login, password change, forgot/reset password |
| `UserService` | Admin-controlled account provisioning |
| `TeacherPortalService` | Announcement and homework management |
| `ParentPortalService` | Child-context content retrieval and viewed tracking |
| `FileStorageService` | Local file storage for images and attachments |
| `DevDataSeeder` | Seeds development data (guarded by `app.seed.enabled`) |
| `App.jsx` | Top-level router with role-based route groupings |
| `AdminLayout / TeacherLayout / ParentLayout` | Role-specific sidebar layouts |

---

## 🚀 Getting Started

### Prerequisites
- Java 21
- Node.js 18+ and npm
- MySQL 8+

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd nursery-management-system

# 2. Create the database
mysql -u root -p -e "CREATE DATABASE nursery_db;"

# 3. Start the backend (port 8080)
cd backend
./mvnw spring-boot:run

# 4. Start the frontend (port 5173)
cd frontend
npm install
npm run dev
```

> Hibernate `ddl-auto=update` creates all tables automatically on first run. No migration scripts required.

---

## 🔧 Configuration

Backend configuration is in `backend/src/main/resources/application.properties`. Key environment variables:

| Variable | Description |
|---|---|
| `JWT_SECRET` | JWT signing key |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials (Gmail App Password recommended) |
| `FRONTEND_URL` | Base URL for password reset links (default: `http://localhost:5173`) |
| `UPLOAD_DIR` | Root directory for uploaded files (default: `uploads/`) |

---

## 🧪 Demo Accounts

When `app.seed.enabled=true` (default), the seeder creates the following accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!` |
| Teacher | `teacher@example.com` | `Teacher123!` |
| Teacher | `priya.fernando@example.com` | `Teacher123!` |
| Parent | `parent@example.com` | `Parent123!` |

Sample data includes students, admission applications, portal content, and public site content.

---

## 📦 File Storage & Email

- Uploaded files are stored locally under `uploads/` (staff photos, student photos, gallery, attachments).
- Email (password reset, account provisioning) requires SMTP credentials via environment variables. The application starts without them; only email sending will fail.

---

## 📌 Project Status

All core planned features are implemented:

- [x] Public website with CMS-managed content
- [x] JWT authentication and role-based access control
- [x] Admin portal (staff, students, admins, admissions, public site CMS)
- [x] Teacher portal (announcements, homework, attachments)
- [x] Parent portal (child context, content viewing, downloads, viewed tracking)
- [x] Account provisioning and lifecycle management
- [x] Forgot/reset password via email
- [x] Forced first-login password change
- [x] Development seed data

---

## 🎓 Academic Note

This system was developed as the practical software artefact for an **MSc Computing project**. The implementation focuses on full-stack integration, security patterns, and domain-appropriate features rather than production-scale concerns such as containerisation or cloud deployment.

*Developed by Anjana Silva — MSc Software Engineering Project, 2025/2026*
