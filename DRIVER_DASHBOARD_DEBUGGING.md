# Driver Dashboard Debugging Guide

## Issue Summary
Marie Driver's dashboard shows zero trips and zero passengers despite having active assignments (Douala → Bafoussam route, BUS-004).

---

## Root Causes Identified

### 1. API Query Limitation (PRIMARY ISSUE)
**File:** `api/dashboards/drivers/my_trips.php`

**Problem:** The original API only queries trips where `driver_id` matches the logged-in driver:
```php
WHERE t.driver_id = ?
```

**Why it fails:** Trips are assigned to driver IDs in the trips table, but drivers may not be directly assigned to trips initially. The dashboard should also show trips on the driver's assigned route and bus.

**Solution Applied:** Modified to include trips matching driver's assigned route AND bus:
```php
WHERE t.driver_id = ?
   OR t.route_id = ?
   OR t.bus_id = ?
```

---

### 2. Driver ID Mapping Issue
**Problem:** The frontend sends `user.id` (from users table) but the API expects driver internal ID.

**Flow:**
1. User logs in → `localStorage` stores `user.id` (users table ID, e.g., 4)
2. Frontend calls API with `driver_id: user.id`  
3. API queries `drivers` table using `user_id` to get internal `driver.id`
4. This should work correctly

**Verification needed:** Check that `drivers.user_id` matches the logged-in user's ID.

---

### 3. Driver Assignment Missing in Database
**Problem:** Even with the API fix, if Marie Driver has no `assigned_route_id` or `assigned_bus_id` in the `drivers` table, no trips will show.

**Database columns:**
- `drivers.assigned_route_id` - The route the driver is assigned to
- `drivers.assigned_bus_id` - The bus the driver is assigned to

**Check this SQL:**
```sql
SELECT d.id, d.user_id, d.assigned_route_id, d.assigned_bus_id, d.status,
       r.origin, r.destination, b.bus_number
FROM drivers d
LEFT JOIN routes r ON d.assigned_route_id = r.id
LEFT JOIN buses b ON d.assigned_bus_id = b.id
WHERE d.user_id = <marie_user_id>;
```

---

### 4. Trip Data Missing or Unassigned
**Problem:** Trips exist in the database but are either:
- Not assigned to Marie (driver_id is NULL or different)
- Not on Marie's assigned route
- Not using Marie's assigned bus

**Check this SQL:**
```sql
-- See all trips for Douala → Bafoussam route
SELECT t.id, t.departure_date, t.departure_time, t.driver_id, t.bus_id, t.route_id,
       r.origin, r.destination, b.bus_number
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN buses b ON t.bus_id = b.id
WHERE r.origin = 'Douala' AND r.destination = 'Bafoussam'
ORDER BY t.departure_date DESC, t.departure_time ASC;
```

---

### 5. Date/Time Filtering Issue
**Problem:** Today's date filtering uses local time but trips may be stored in UTC.

**Current code uses:**
```javascript
const today = new Date();
const todayStr = today.getFullYear() + '-' + 
  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
  String(today.getDate()).padStart(2, '0');
```

**This is correct for Africa/Douala timezone (UTC+1)** but ensure:
- MySQL server timezone is correct
- Trip dates are stored in local date format

---

### 6. Driver Status Inactive
**Problem:** Driver record has `status = 'inactive'` or `'suspended'`

**Check:**
```sql
SELECT id, user_id, status FROM drivers WHERE user_id = <marie_user_id>;
```

**Should return:** `status = 'active'`

---

### 7. CORS or Authentication Issues
**Problem:** API request fails silently

**Debug steps:**
1. Check browser console for network errors
2. Check PHP error logs
3. Verify API endpoint is accessible:
   ```
   POST /api/dashboards/drivers/my_trips.php
   Body: {"user_id": 4}
   ```

---

## Database Verification Steps

Run these SQL queries to diagnose the issue:

```sql
-- 1. Find Marie's user ID
SELECT id, name, email, role FROM users WHERE email = 'marie.driver@camtransit.com';

-- 2. Find Marie's driver record
SELECT d.*, u.name, u.email 
FROM drivers d 
JOIN users u ON d.user_id = u.id 
WHERE u.email = 'marie.driver@camtransit.com';

-- 3. Check assigned route and bus
SELECT d.id, d.assigned_route_id, d.assigned_bus_id, d.status,
       r.origin, r.destination, r.route_code,
       b.bus_number, b.bus_name, b.total_seats
FROM drivers d
LEFT JOIN routes r ON d.assigned_route_id = r.id
LEFT JOIN buses b ON d.assigned_bus_id = b.id
WHERE d.user_id = (SELECT id FROM users WHERE email = 'marie.driver@camtransit.com');

-- 4. Check all trips for Douala → Bafoussam
SELECT t.*, r.origin, r.destination, b.bus_number, d.name as driver_name
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers dr ON t.driver_id = dr.id
LEFT JOIN users d ON dr.user_id = d.id
WHERE r.origin = 'Douala' AND r.destination = 'Bafoussam'
ORDER BY t.departure_date DESC;

-- 5. Check trips assigned to Marie specifically
SELECT t.*, r.origin, r.destination
FROM trips t
JOIN routes r ON t.route_id = r.id
WHERE t.driver_id = (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'marie.driver@camtransit.com'));
```

---

## Required Database Fixes

If assignments are missing, run:

```sql
-- Get Marie's driver ID
SET @marie_driver_id := (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'marie.driver@camtransit.com'));

-- Get route ID for Douala → Bafoussam
SET @douala_bafoussam := (SELECT id FROM routes WHERE origin = 'Douala' AND destination = 'Bafoussam');

-- Get BUS-004 ID
SET @bus_004 := (SELECT id FROM buses WHERE bus_number = 'BUS-004');

-- Assign route to driver
UPDATE drivers SET assigned_route_id = @douala_bafoussam WHERE id = @marie_driver_id;

-- Assign bus to driver  
UPDATE drivers SET assigned_bus_id = @bus_004 WHERE id = @marie_driver_id;

-- Also update the trips table to assign Marie to Douala → Bafoussam trips
UPDATE trips t
JOIN routes r ON t.route_id = r.id
SET t.driver_id = @marie_driver_id
WHERE r.origin = 'Douala' AND r.destination = 'Bafoussam';

-- Verify
SELECT d.id, d.assigned_route_id, d.assigned_bus_id, r.origin, r.destination, b.bus_number
FROM drivers d
LEFT JOIN routes r ON d.assigned_route_id = r.id
LEFT JOIN buses b ON d.assigned_bus_id = b.id
WHERE d.id = @marie_driver_id;
```

---

## Frontend Debugging

Add this to Dashboard.jsx to see raw data:

```javascript
// In fetchDriverData function, after getting data:
console.log("API Response:", data);
console.log("Trips:", trips);
console.log("Assignment:", data.assignment);
```

---

## Summary of Changes Made

1. **my_trips.php** - Modified to query trips by driver_id OR assigned_route_id OR assigned_bus_id
2. **Dashboard.jsx** - Updated to handle new API response format, show bus seat capacity
3. **Trips.jsx** - Updated to use `data.trips` instead of `data.data`
4. **Passengers.jsx** - Updated to use `data.trips`

---

## Testing Checklist

After making changes:
- [ ] Clear browser cache or use incognito mode
- [ ] Log out and log back in as Marie Driver
- [ ] Check browser console for errors
- [ ] Verify trips appear in dashboard
- [ ] Check "Today's Trips" section
- [ ] Verify bus seat capacity shows correctly
