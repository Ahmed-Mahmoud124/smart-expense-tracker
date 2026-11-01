# 💰 Web-Based Personal Expense Tracker

> Bachelor's Thesis Project — Computer Science Department  
> Full-Stack Web Application: React.js + Node.js + Express.js + MySQL

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Demo Credentials](#demo-credentials)
8. [API Documentation](#api-documentation)
9. [Deployment](#deployment)

---

## Prerequisites

Ensure the following are installed:

| Tool        | Version   | Download |
|-------------|-----------|----------|
| Node.js     | >= 18.0.0 | https://nodejs.org |
| npm         | >= 9.0.0  | Bundled with Node.js |
| MySQL       | >= 8.0    | https://dev.mysql.com/downloads/ |
| Git         | Latest    | https://git-scm.com |

---

## Project Structure

```
expense-tracker/
├── backend/          # Node.js + Express.js REST API
│   ├── config/       # Database connection
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Auth, error, validation
│   ├── routes/       # Express routers
│   ├── validators/   # express-validator chains
│   ├── utils/        # Response helpers
│   ├── sql/          # Schema + seed SQL files
│   ├── .env.example  # Environment variable template
│   └── server.js     # Entry point
└── frontend/         # React.js SPA
    ├── public/       # Static assets
    └── src/
        ├── api/      # Axios instance + API helpers
        ├── components/  # Reusable UI components
        ├── context/  # Auth context
        ├── hooks/    # Custom React hooks
        ├── pages/    # Route-level page components
        └── styles/   # Global CSS design system
```

---

## Database Setup

### 1. Start MySQL and open a client

```bash
mysql -u root -p
```

### 2. Create the database

```sql
CREATE DATABASE expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Run the schema

```bash
mysql -u root -p expense_tracker < backend/sql/schema.sql
```

### 4. Load sample data (optional but recommended)

```bash
mysql -u root -p expense_tracker < backend/sql/seed.sql
```

---

## Backend Setup

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

### 4. Edit `.env` with your values

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker

JWT_SECRET=your_super_secret_jwt_key_minimum_64_characters_long_replace_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another_super_secret_refresh_key_minimum_64_characters_long
JWT_REFRESH_EXPIRES_IN=30d

CLIENT_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
```

### 5. Start the backend

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The API will be available at: `http://localhost:5000/api`  
Health check: `http://localhost:5000/api/health`

---

## Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file (optional)

```bash
# Create frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

> The `proxy` field in `package.json` already handles this in development.

### 4. Start the frontend

```bash
npm start
```

The application will open at: `http://localhost:3000`

---

## Running the Application

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm start
```

Then visit: **http://localhost:3000**

---

## Demo Credentials

Two pre-seeded accounts are available after running `seed.sql`:

| Name         | Email                 | Password   | Currency |
|--------------|-----------------------|------------|----------|
| Ahmed Hassan | ahmed@example.com     | Test@1234  | EGP      |
| Sara Mohamed | sara@example.com      | Test@1234  | USD      |

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

### Auth Endpoints

| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | /auth/register              | No   | Create new account       |
| POST   | /auth/login                 | No   | Login, receive tokens    |
| POST   | /auth/refresh               | No   | Refresh access token     |
| GET    | /auth/me                    | Yes  | Get current user         |
| PATCH  | /auth/change-password       | Yes  | Change password          |

**POST /auth/register**
```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "password": "Test@1234",
  "currency": "EGP"
}
```

**POST /auth/login**
```json
{
  "email": "ahmed@example.com",
  "password": "Test@1234"
}
```

---

### Transaction Endpoints

| Method | Endpoint                    | Auth | Description               |
|--------|-----------------------------|------|---------------------------|
| GET    | /transactions               | Yes  | List (paginated+filtered) |
| POST   | /transactions               | Yes  | Create transaction        |
| GET    | /transactions/summary       | Yes  | Period totals             |
| GET    | /transactions/:id           | Yes  | Get single transaction    |
| PUT    | /transactions/:id           | Yes  | Update transaction        |
| DELETE | /transactions/:id           | Yes  | Delete transaction        |

**Query params for GET /transactions:**

| Param        | Type   | Description                        |
|--------------|--------|------------------------------------|
| page         | number | Page number (default: 1)           |
| limit        | number | Per page, max 100 (default: 20)    |
| type         | string | income \| expense                  |
| category_id  | number | Filter by category                 |
| start_date   | date   | ISO date YYYY-MM-DD                |
| end_date     | date   | ISO date YYYY-MM-DD                |
| search       | string | Search description/notes           |
| sort_by      | string | transaction_date \| amount         |
| sort_order   | string | ASC \| DESC                        |

**POST /transactions body:**
```json
{
  "type": "expense",
  "amount": 250.00,
  "category_id": 1,
  "description": "Grocery shopping",
  "transaction_date": "2025-06-10",
  "notes": "Weekly groceries"
}
```

---

### Budget Endpoints

| Method | Endpoint          | Auth | Description             |
|--------|-------------------|------|-------------------------|
| GET    | /budgets          | Yes  | List all budgets        |
| POST   | /budgets          | Yes  | Create budget           |
| GET    | /budgets/alerts   | Yes  | Get triggered alerts    |
| GET    | /budgets/:id      | Yes  | Get single budget       |
| PUT    | /budgets/:id      | Yes  | Update budget           |
| DELETE | /budgets/:id      | Yes  | Delete budget           |

**POST /budgets body:**
```json
{
  "name": "Monthly Food Budget",
  "amount": 3000,
  "period": "monthly",
  "category_id": 1,
  "start_date": "2025-06-01",
  "end_date": "2025-06-30",
  "alert_threshold": 80,
  "notes": "Groceries and dining"
}
```

---

### Category Endpoints

| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| GET    | /categories       | Yes  | List all categories      |
| POST   | /categories       | Yes  | Create custom category   |
| GET    | /categories/:id   | Yes  | Get single category      |
| PUT    | /categories/:id   | Yes  | Update category          |
| DELETE | /categories/:id   | Yes  | Soft-delete category     |

---

### Dashboard & Analytics Endpoints

| Method | Endpoint                         | Auth | Description                   |
|--------|----------------------------------|------|-------------------------------|
| GET    | /dashboard/summary               | Yes  | Full dashboard payload        |
| GET    | /dashboard/analytics/monthly     | Yes  | Monthly income vs expense     |
| GET    | /dashboard/analytics/category    | Yes  | Category breakdown            |
| GET    | /dashboard/analytics/daily       | Yes  | Daily spending for a month    |
| GET    | /dashboard/analytics/yearly      | Yes  | Year-over-year comparison     |

---

### Profile Endpoints

| Method | Endpoint          | Auth | Description                |
|--------|-------------------|------|----------------------------|
| GET    | /profile          | Yes  | Get profile + stats        |
| PUT    | /profile          | Yes  | Update profile             |
| GET    | /profile/goals    | Yes  | Financial goals progress   |
| DELETE | /profile/account  | Yes  | Delete account (soft)      |

---

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Data retrieved.",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description.",
  "errors": [
    { "field": "email", "message": "Email is required." }
  ]
}
```

---

## Deployment

### Backend (Production)

```bash
# Set NODE_ENV in .env
NODE_ENV=production

# Install production deps only
npm install --omit=dev

# Start
npm start
```

Recommended: deploy on **Railway**, **Render**, or **VPS with PM2**:

```bash
npm install -g pm2
pm2 start server.js --name expense-tracker-api
pm2 save
pm2 startup
```

### Frontend (Production Build)

```bash
cd frontend

# Set production API URL
echo "REACT_APP_API_URL=https://your-api-domain.com/api" > .env.production

# Build
npm run build

# The /build folder is ready to deploy to:
# - Netlify (drag & drop /build)
# - Vercel  (auto-detected)
# - Nginx   (serve /build as static files)
```

### Nginx config (serve frontend + proxy API)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/expense-tracker/frontend/build;
    index index.html;

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```