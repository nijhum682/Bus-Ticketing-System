# Implementation Plan - Add ASP.NET Backend with MySQL (XAMPP)

Add a database to the Bus Ticketing System using ASP.NET Core as the backend and MySQL (via XAMPP).

## User Review Required

> [!IMPORTANT]
> This plan will migrate the static frontend into an ASP.NET Core Web API project to serve as the backend. You will need XAMPP running with MySQL enabled.

- Do you have a specific database name or table structure in mind beyond 'Users'?
- Should I use Entity Framework Core for database operations? (Proposed: Yes)

## Proposed Changes

### Backend (ASP.NET Core)

#### [NEW] Backend Project
- Create an ASP.NET Core Web API project.
- Add `Pomelo.EntityFrameworkCore.MySql` for MySQL support.
- Configure `Program.cs` to serve static files and use the database.

#### [NEW] Data Models and Context
- Create a `User` model with fields: Id, Name, Email, Password (hashed), Phone.
- Create an `AppDbContext` for EF Core.

#### [NEW] Authentication Controller
- `POST /api/auth/signup`: Register a new user in MySQL.
- `POST /api/auth/signin`: Authenticate user against MySQL.

### Frontend Integration

#### `signup.js`
- Update the form submission to use `fetch()` to call the backend `/api/auth/signup` endpoint.

#### `signin.js`
- Update the form submission to use `fetch()` to call the backend `/api/auth/signin` endpoint.

### Database Setup
- Provide a SQL script to create the database and table in XAMPP (MySQL).

## Verification Plan

### Automated Tests
- None planned as it's a migration to a new framework, but I will check for build errors.

### Manual Verification
1. Start XAMPP MySQL.
2. Run the SQL script to create the database.
3. Run the ASP.NET Core project.
4. Test Signup and Signin from the browser.
