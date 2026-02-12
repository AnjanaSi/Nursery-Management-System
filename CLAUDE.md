# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nursery Management System ("MerryKids") — a full-stack monorepo with a Spring Boot backend and React frontend.

## Build & Run Commands

### Backend (from `backend/`)

```bash
./mvnw spring-boot:run              # Run dev server (port 8080)
./mvnw clean install                # Build with tests
./mvnw clean install -DskipTests    # Build without tests
./mvnw test                         # Run all tests
./mvnw test -Dtest=ClassName        # Run a single test class
./mvnw test -Dtest=ClassName#method # Run a single test method
```

### Frontend (from `frontend/`)

```bash
npm run dev       # Dev server with HMR (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Architecture

**Backend:** Spring Boot 3.5 / Java 21 / Maven

- Package root: `com.merrykids.backend`
- Spring Data JPA with MySQL (`nursery_db` on localhost:3306)
- Spring Security for auth
- Bean Validation for input validation
- Lombok for boilerplate reduction
- `application.properties` holds DB config (ddl-auto: update, show-sql: true)

**Frontend:** React 19 / Vite 7 / JavaScript (JSX)

- Entry: `src/main.jsx` → `src/App.jsx`
- Bootstrap 5 for styling
- ESLint with react-hooks and react-refresh plugins

**Ports:** Backend 8080, Frontend dev server 5173.

## Database

MySQL required. Current config in `backend/src/main/resources/application.properties`:

- URL: `jdbc:mysql://localhost:3306/nursery_db`
- User: `root` / Password: `mysql`
- Hibernate auto-DDL enabled (`update` mode)

## Project Rules & Conventions (Must Follow)

### Scope (Finalised Features)

Public website:

- Home, About Us (staff details), Gallery (photos/videos), Events/News, Contact (phone/email/map)
- Admission announcements (opening/closing dates)
- Online application form with document upload

Secure portal (role-based):

- Parent: view notices/updates, download resources (timetables/homework sheets)
- Teacher/Staff: upload notices/homework, upload downloadable resources
- Admin: staff management (CRUD), student management (CRUD), review admission applications (pending/accepted/rejected)

### Roles & Access

- No open self-registration for parents.
- Parent access only after admission is accepted.
- Preferred: invite-only onboarding (admin triggers invite; parent sets password).
- Roles: ADMIN, TEACHER, PARENT. Public has no login.

### API Standards

- Use DTOs for requests/responses (do not expose entities directly).
- Standard JSON response format:
  - Success: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "error": "message" }`
- Use proper HTTP codes (400 validation, 401 unauthenticated, 403 unauthorized, 404 not found, 500 server).
- Validate inputs using Bean Validation (`@Valid`, `@NotNull`, etc.).
- Add a global exception handler (`@ControllerAdvice`) for consistent error responses.

### Backend Structure

Use consistent packages under `com.merrykids.backend`:

- `config/`, `security/`, `controller/`, `service/`, `repository/`, `dto/`, `entity/`, `exception/`, `util/`

## Authentication & Security Rules

- Use JWT-based authentication (stateless).
- Roles: ADMIN, TEACHER, PARENT.
- No session-based authentication.
- No open self-registration for parents.
- Passwords must be stored using BCrypt hashing.
- Protect endpoints using role-based authorization.
- Public endpoints must be clearly separated from secured endpoints.
- Use `/api/v1/` prefix for all backend APIs.

### Frontend Structure

- Keep pages under `src/pages/` and reusable UI under `src/components/`
- Keep API calls in `src/services/api/` (Axios client)
- Use Bootstrap 5 patterns consistently (forms, tables, modals, alerts, spinners)

## UI/UX Guidelines (Nursery-Friendly Design)

- Overall vibe: warm, friendly, modern, playful but professional (not childish, not corporate).
- Use Bootstrap 5 consistently; avoid mixing UI libraries.
- Design principles:
  - Plenty of whitespace and clear layout
  - Rounded corners (e.g., `rounded-3`)
  - Soft shadows (`shadow-sm`) for cards
  - Consistent spacing (`py-`, `px-`, `gap-`)
  - Consistent typography (Bootstrap defaults OK, avoid too many fonts)
- Use a consistent layout:
  - Public site: top navbar + hero section + sections/cards
  - Secure portal: sidebar (or top nav) + page header + content area
- Use images:
  - Keep a placeholder logo at `frontend/src/assets/logo.png` (or `/public/logo.png`)
  - Use placeholder nursery photos in `/public/images/` (e.g., classroom.jpg, playtime.jpg)
  - All images should be referenced via relative paths and should not break if missing (use fallbacks).
- Provide UX states everywhere:
  - Loading spinners
  - Empty states ("No notices yet")
  - Friendly error alerts
- Forms should be clean:
  - Use Bootstrap form controls
  - Inline validation messages
  - Disable submit button while submitting

## Responsive Design Requirement (Mandatory)

- The application must be fully responsive and usable on:
  - Desktop (≥1200px)
  - Tablet (768px–1199px)
  - Mobile (<768px)
- Use Bootstrap 5 responsive grid system (`container`, `row`, `col-*`).
- Use responsive navbar with collapse toggle for small screens.
- Avoid fixed widths unless necessary.
- Tables must be wrapped in `table-responsive`.
- Forms must stack vertically on small screens.
- Sidebar (if used) must collapse or convert to top navigation on mobile.
- Test layouts using browser responsive mode before finalizing components.

### Git Workflow

- Use feature branches: `feature/<name>`
- Commit small and often. One feature slice = one branch.
- Do not mix unrelated changes in one commit.

### File Upload Rules

- Store uploaded files locally in a server folder (MSc-friendly) and store metadata in DB.
- Validate file size/type and return clear errors.

## Development Seed Data

- Provide repeatable seed data for development to avoid empty UI.
- Use a DevDataSeeder (CommandLineRunner) that runs only when `app.seed.enabled=true`.
- Seed at least: 1 admin, 1 teacher, 1 parent, 1 student, 1 admission application, 1 notice, 1 resource.
- Passwords must be BCrypt-hashed (do not store plain passwords).
