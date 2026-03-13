# Bus Management System

A comprehensive bus management system built with React, PHP, and MySQL. This application provides a complete solution for managing bus bookings, routes, drivers, and administrative operations.

## Features

### For Passengers
- Browse available bus routes
- Book tickets for trips
- View booking history
- Manage profile and settings
- View and manage tickets

### For Drivers
- View assigned trips
- Update trip status
- View passenger lists
- Scan and verify tickets
- Manage notifications

### For Administrators
- Comprehensive dashboard with analytics
- Manage buses, routes, and schedules
- Handle driver assignments
- View and manage all bookings
- Generate reports
- User management

## Tech Stack

- **Frontend**: React + Vite
- **UI Components**: shadcn/ui
- **Backend**: PHP
- **Database**: MySQL
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PHP (v7.4 or higher)
- MySQL (v5.7 or higher)
- XAMPP (recommended for local development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Investor-Honourable/Bus-System.git
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Set up the database:
   - Import the SQL file from `api/database_setup.sql` into your MySQL database
   - Configure database connection in `api/config/db.php`

5. Start your local PHP server (if using XAMPP, ensure Apache is running)

## Project Structure

```
Bus_system/
├── api/                    # PHP backend
│   ├── config/            # Database configuration
│   ├── controller/        # Auth controllers
│   ├── dashboards/        # API endpoints
│   └── *.php             # Setup and utility files
├── src/                   # React frontend
│   ├── app/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   └── hooks/        # Custom hooks
│   └── assets/           # Static assets
├── package.json
└── vite.config.ts
```

## License

This project is licensed under the MIT License.

## Author

**Created by [ METUGE HONOURABLE]**

---

For questions or contributions, please contact the repository owner.
