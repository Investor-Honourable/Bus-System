# Comprehensive Admin Dashboard Guide

## Overview

The admin dashboard provides complete visibility and control over the bus system backend. It includes real-time data monitoring, user management, booking control, activity logging, system metrics, and data export capabilities.

## Features

### 1. Enhanced Dashboard Overview
- **Real-time Statistics**: Live updates every 30 seconds
- **Quick Stats Cards**: Users, Drivers, Buses, Routes, Bookings, Revenue
- **Interactive Charts**: Booking status, User distribution, Recent activity
- **System Health Monitoring**: CPU, Memory, Disk usage, Active connections

### 2. User Management
- **View All Users**: Complete list with search and filtering
- **Role Management**: Change user roles (passenger, driver, admin)
- **User Status**: Activate/Deactivate user accounts
- **Add Users**: Create new user accounts
- **Delete Users**: Remove users (with safety checks)
- **Export Data**: Download user data as CSV or JSON

### 3. Driver Management
- **Driver List**: View all drivers with statistics
- **Driver Assignment**: Assign drivers to routes and buses
- **Performance Tracking**: Monitor driver trips and passengers
- **License Management**: Track license numbers and expiry
- **Status Control**: Activate/Deactivate drivers

### 4. Booking Management
- **All Bookings**: View complete booking history
- **Status Filtering**: Filter by confirmed, pending, cancelled, completed
- **Booking Actions**: Confirm, cancel, or assign seats
- **Revenue Tracking**: Monitor total and per-booking revenue
- **Passenger Details**: View passenger information for each booking

### 5. Activity Logs & Audit Trail
- **Comprehensive Logging**: All system activities are logged
- **User Actions**: Track user logins, registrations, profile updates
- **Booking Activities**: Monitor booking creation, confirmation, cancellation
- **Admin Actions**: Log administrative changes
- **Filtering**: Filter by activity type, user, date range
- **Export**: Download activity logs as JSON

### 6. System Metrics & Monitoring
- **Performance Metrics**: CPU, Memory, Disk usage
- **Database Health**: Connection status and response time
- **Active Sessions**: Monitor current user sessions
- **Recent Activity**: Track activities in the last hour
- **Uptime Monitoring**: System uptime tracking

### 7. Data Export
- **CSV Export**: Export any data table to CSV format
- **JSON Export**: Export data in JSON format for API integration
- **Filtered Export**: Export only filtered/searched results
- **Batch Export**: Export multiple datasets at once

### 8. Advanced Filtering & Search
- **Global Search**: Search across all data tables
- **Role Filter**: Filter users by role
- **Status Filter**: Filter by active/inactive status
- **Date Filter**: Filter by creation date
- **Real-time Filtering**: Instant results as you type

### 9. Real-time Updates
- **Auto-refresh**: Data refreshes every 30 seconds
- **Manual Refresh**: Force refresh with one click
- **Live Notifications**: Real-time notification updates
- **Status Indicators**: Visual indicators for data freshness

## API Endpoints

### Users API
```
GET /api/dashboards/admin/users.php
- Fetch all users

POST /api/dashboards/admin/users.php
- Create new user

PUT /api/dashboards/admin/users.php
- Update user

DELETE /api/dashboards/admin/users.php
- Delete user
```

### Drivers API
```
GET /api/dashboards/admin/drivers.php
- Fetch all drivers with statistics

POST /api/dashboards/admin/drivers.php
- Create new driver

PUT /api/dashboards/admin/drivers.php
- Update driver or assign route/bus

DELETE /api/dashboards/admin/drivers.php
- Delete driver
```

### Bookings API
```
GET /api/dashboards/admin/bookings.php
- Fetch all bookings

POST /api/dashboards/admin/bookings.php
- Update booking status or payment

DELETE /api/dashboards/admin/bookings.php
- Cancel booking
```

### Activity Logs API
```
GET /api/dashboards/admin/activity_logs.php
- Fetch activity logs with filtering

Parameters:
- limit: Number of records to return
- offset: Pagination offset
- type: Filter by activity type
- user_id: Filter by user
- start_date: Filter from date
- end_date: Filter to date

POST /api/dashboards/admin/activity_logs.php
- Create new activity log
```

### System Metrics API
```
GET /api/dashboards/admin/system_metrics.php
- Fetch system health and performance metrics
```

## Database Schema

### Activity Logs Table
```sql
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  activity_type VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Usage Guide

### Accessing the Dashboard
1. Login as an admin user
2. Navigate to `/dashboard/admin`
3. The enhanced dashboard loads automatically

### Managing Users
1. Click "Users" in the sidebar
2. Use search to find specific users
3. Use role filter to view by role
4. Click user actions to edit/delete
5. Use "Add User" button to create new users

### Managing Drivers
1. Click "Drivers" in the sidebar
2. View driver statistics and assignments
3. Click "Assign" to assign route/bus
4. Click "Edit" to update driver details
5. Monitor driver performance metrics

### Viewing Bookings
1. Click "Bookings" in the sidebar
2. Filter by status (confirmed, pending, cancelled)
3. Search by passenger name or route
4. Click booking to view details
5. Use actions to confirm/cancel bookings

### Monitoring Activity
1. Click "Activity Logs" tab
2. View recent system activities
3. Filter by activity type or user
4. Export logs for analysis
5. Monitor for suspicious activity

### Checking System Health
1. Click "System" tab
2. View CPU, Memory, Disk usage
3. Check database connection status
4. Monitor active sessions
5. Review system uptime

### Exporting Data
1. Navigate to any data table
2. Use search/filters as needed
3. Click "Export" button
4. Choose CSV or JSON format
5. File downloads automatically

## Best Practices

### Security
- Regularly review activity logs for suspicious activity
- Monitor failed login attempts
- Check for unusual booking patterns
- Review user role changes

### Performance
- Monitor system metrics regularly
- Check database response times
- Review active session counts
- Monitor disk usage trends

### Data Management
- Export data regularly for backups
- Archive old activity logs
- Clean up cancelled bookings
- Review and remove inactive users

### Monitoring
- Check dashboard daily for anomalies
- Review booking patterns weekly
- Monitor revenue trends monthly
- Track driver performance quarterly

## Troubleshooting

### Data Not Loading
- Check browser console for errors
- Verify API endpoints are accessible
- Check database connection
- Refresh the page

### Export Not Working
- Ensure pop-ups are allowed
- Check browser download settings
- Verify data exists to export
- Try different export format

### Real-time Updates Not Working
- Check internet connection
- Verify auto-refresh is enabled
- Check browser console for errors
- Manual refresh as fallback

### Performance Issues
- Reduce data fetch frequency
- Limit number of records displayed
- Clear browser cache
- Check server resources

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check server error logs
4. Contact system administrator

## Version History

### v1.0.0 (Current)
- Enhanced dashboard with real-time updates
- Comprehensive user management
- Advanced driver management
- Complete booking control
- Activity logging system
- System metrics monitoring
- Data export functionality
- Advanced filtering and search
