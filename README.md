# Invoice Management

A multi-user Invoice & Billing Portal designed for small businesses.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** PHP (OOP, REST API)
- **Database:** MySQL

## Features
- **Multi-User Partitioning:** Secure business owner registration & access controls.
- **SaaS Dashboard:** Financial metrics, outstanding balances, and recent activities.
- **Client Management:** Manage client details, billing addresses, and invoices.
- **Invoice & Payments:** Create invoices, auto-calculate tax/totals, and record payment history.
- **Settings Panel:** Update business profiles, upload logo, change passwords, and configure theme preferences.

## Setup Instructions

### Database Setup
Import the database schema:
```bash
mysql -u root -p < database/schema.sql
```

### Backend Setup
1. Configure credentials in `backend/config/database.php`.
2. Start PHP server:
   ```bash
   cd backend
   php -S localhost:8000
   ```

### Frontend Setup
1. Install dependencies & start the dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Access the portal at `http://localhost:5173`.
