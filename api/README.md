# CamTransit Bus Management System - Backend API

## Overview

This is the backend API for the CamTransit Bus Management System, a comprehensive bus booking and management platform. The backend is built with PHP and MySQL.

## Database Setup

### Prerequisites

- XAMPP (or similar PHP/MySQL environment)
- PHP 7.4 or higher
- MySQL 5.7 or higher

### Installation Steps

1. **Start XAMPP**
   - Start Apache and MySQL services in XAMPP Control Panel

2. **Create Database**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - The database will be created automatically when you run the setup script

3. **Run Database Setup**
   - Navigate to: http://localhost/Bus_system/api/setup_database.php
   - This will create all necessary tables and insert sample data
   - You should see a success message with the number of tables created

4. **Verify Installation**
   - Check phpMyAdmin to verify the `bus_system` database was created
   - You should see the following tables:
     - users
     - passengers
     - drivers
     - buses
     - routes
     - trips
     - bookings
     - tickets
     - notifications
     - user_settings
     - payment_methods
     - password_reset_tokens
     - login_activity
     - payments
     - reviews

## Sample Data

The database comes with pre-populated sample data:

### Users
- **Admin**: admin@camtransit.com / admin123
- **Driver**: driver@camtransit.com / driver123
- **Passenger**: passenger@camtransit.com / passenger123

### Buses
- BUS-001: CamTransit Express (Luxury, 50 seats)
- BUS-002: City Liner (Standard, 40 seats)
- BUS-003: VIP Coach (VIP, 20 seats)
- BUS-004: Economy Bus (Standard, 45 seats)
- BUS-005: Mini Transit (Minibus, 15 seats)

### Routes
- Douala to Yaoundé (280km, 3 hours)
- Douala to Kribi (150km, 2 hours)
- Douala to Bafoussam (200km, 2.5 hours)
- And more...

### Trips
- Multiple trips scheduled for the next 30 days
- Various departure times throughout the day

## API Endpoints

### Authentication
- `POST /api/auth.php` - Login/Register
- `POST /api/controller/login.php` - Login
- `POST /api/controller/signup.php` - Register
- `POST /api/controller/forgot_password.php` - Request password reset
- `POST /api/controller/reset_password.php` - Reset password

### Main API
- `POST /api/index.php` - Main API endpoint (handles various actions)

#### Actions:
- `get_routes` - Get all active routes
- `get_buses` - Get all active buses
- `get_trips` - Search for trips
- `create_booking` - Create a new booking
- `get_user_bookings` - Get user's bookings
- `cancel_booking` - Cancel a booking
- `get_user_tickets` - Get user's tickets
- `get_trip_details` - Get trip details
- `get_notifications` - Get user notifications
- `mark_notification_read` - Mark notification as read
- `mark_all_notifications_read` - Mark all notifications as read
- `get_user_profile` - Get user profile
- `update_user_profile` - Update user profile
- `get_user_settings` - Get user settings
- `update_user_settings` - Update user settings

### Admin Dashboard
- `GET/POST /api/dashboards/admin/bookings.php` - Manage bookings
- `GET/POST/PUT/DELETE /api/dashboards/admin/buses.php` - Manage buses
- `GET/POST/PUT/DELETE /api/dashboards/admin/routes.php` - Manage routes
- `GET/POST/PUT/DELETE /api/dashboards/admin/schedules.php` - Manage trips/schedules
- `GET/POST/PUT/DELETE /api/dashboards/admin/users.php` - Manage users
- `GET/POST/PUT/DELETE /api/dashboards/admin/drivers.php` - Manage drivers
- `GET/POST /api/dashboards/admin/assign_driver.php` - Assign drivers to trips
- `POST /api/dashboards/admin/update_schedule.php` - Update trip status

### Driver Dashboard
- `POST /api/dashboards/drivers/my_trips.php` - Get driver's trips
- `POST /api/dashboards/drivers/trip_passengers.php` - Get trip passengers
- `POST /api/dashboards/drivers/verify_ticket.php` - Verify ticket
- `POST /api/dashboards/drivers/update_trip_status.php` - Update trip status
- `POST /api/dashboards/drivers/profile.php` - Get/update driver profile
- `GET/POST /api/dashboards/drivers/settings.php` - Get/update driver settings
- `POST /api/dashboards/drivers/change_password.php` - Change password
- `GET/POST/PUT/DELETE /api/dashboards/drivers/notifications.php` - Manage notifications

### Passenger Dashboard
- `POST /api/dashboards/passenger/dashboard.php` - Get dashboard data
- `POST /api/dashboards/passenger/my_bookings.php` - Get passenger bookings
- `POST /api/dashboards/passenger/cancel_booking.php` - Cancel booking
- `POST /api/dashboards/passenger/profile.php` - Get/update passenger profile
- `POST /api/dashboards/passenger/trip_details.php` - Get trip details
- `POST /api/dashboards/passenger/recentbooking.php` - Get recent bookings
- `POST /api/dashboards/passenger/dashboardstats.php` - Get dashboard statistics

### Settings & Notifications
- `GET/POST /api/settings.php` - Get/update user settings
- `GET/POST/PUT/DELETE /api/notifications.php` - Manage notifications
- `POST /api/dashboards/logout.php` - Logout

## Database Schema

### Core Tables

#### users
- id, name, username, email, phone, gender, password, role, avatar, is_active, created_at, updated_at

#### passengers
- id, user_id, name, username, phone, gender, date_of_birth, address, emergency_contact, created_at, updated_at

#### drivers
- id, user_id, license_number, license_expiry, license_type, status, assigned_bus_id, assigned_route_id, rating, total_trips, total_distance_km, hire_date, created_at, updated_at

#### buses
- id, bus_number, bus_name, bus_type, total_seats, available_seats, amenities, license_plate, model, year, color, status, last_maintenance, next_maintenance, mileage, fuel_type, created_at, updated_at

#### routes
- id, route_code, origin, destination, distance_km, duration_minutes, base_price, description, stops, status, created_at, updated_at

#### trips
- id, bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, booked_seats, status, notes, created_at, updated_at

#### bookings
- id, booking_reference, user_id, trip_id, passenger_name, passenger_email, passenger_phone, seat_numbers, number_of_seats, total_price, payment_status, payment_method, payment_reference, booking_status, cancellation_reason, cancelled_at, created_at, updated_at

#### tickets
- id, ticket_code, booking_id, trip_id, user_id, seat_number, status, verified_at, verified_by, created_at, updated_at

#### notifications
- id, user_id, title, message, type, reference_type, reference_id, is_read, created_at

#### user_settings
- id, user_id, email_notifications, sms_notifications, booking_confirmations, trip_reminders, promotions, two_factor_enabled, language, timezone, created_at, updated_at

#### payment_methods
- id, user_id, type, provider, account_number, account_name, is_default, is_active, created_at, updated_at

#### password_reset_tokens
- id, user_id, token, expires_at, used, created_at

#### login_activity
- id, user_id, device, browser, location, ip_address, is_current, login_at

#### payments
- id, booking_id, user_id, amount, payment_method, payment_provider, transaction_id, status, paid_at, created_at, updated_at

#### reviews
- id, booking_id, user_id, trip_id, driver_id, rating, comment, created_at

## Views

### available_trips
Shows all available trips with full details including route, bus, and driver information.

### booking_details
Shows all booking details with trip, route, bus, and user information.

## Stored Procedures

### create_booking
Creates a new booking with automatic seat availability check and ticket generation.

### cancel_booking
Cancels a booking and restores available seats.

## Triggers

### after_review_insert
Updates driver rating when a new review is inserted.

### after_trip_complete
Updates driver total trips when a trip is completed.

## Security Features

- Password hashing using PHP's `password_hash()` function
- Prepared statements to prevent SQL injection
- Session-based authentication
- Role-based access control
- CORS configuration for frontend access

## Error Handling

All API endpoints return JSON responses with the following structure:

```json
{
  "status": "success|error",
  "message": "Description of result",
  "data": {} // Optional data payload
}
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running in XAMPP
- Check database credentials in `api/config/db.php`
- Ensure the database exists

### API Not Working
- Verify Apache is running in XAMPP
- Check PHP error logs in XAMPP
- Ensure all required tables exist

### Sample Data Not Loading
- Run `api/setup_database.php` again
- Check for any SQL errors in the response
- Verify MySQL user has CREATE and INSERT privileges

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
