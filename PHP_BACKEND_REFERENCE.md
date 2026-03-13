# Bus Management System - PHP Backend Reference

This document provides the complete PHP backend code to connect with the React frontend.

## Database Schema

```sql
-- Create Database
CREATE DATABASE bus_management;
USE bus_management;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses Table
CREATE TABLE buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    route_from VARCHAR(100) NOT NULL,
    route_to VARCHAR(100) NOT NULL,
    distance_km DECIMAL(10,2),
    duration_hours DECIMAL(10,2),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    ticket_class ENUM('Economy', 'Business') DEFAULT 'Economy',
    price DECIMAL(10,2) NOT NULL,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id)
);

-- Tickets Table
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    qr_code TEXT,
    status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

## PHP Backend Files Structure

```
backend/
├── config/
│   └── database.php
├── api/
│   ├── bookings/
│   │   ├── create.php
│   │   ├── read.php
│   │   ├── update.php
│   │   └── delete.php
│   ├── routes/
│   │   ├── create.php
│   │   └── read.php
│   ├── buses/
│   │   └── read.php
│   ├── tickets/
│   │   └── read.php
│   └── stats/
│       └── dashboard.php
└── index.php
```

## Configuration Files

### config/database.php
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "bus_management";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }
}
?>
```

## API Endpoints

### api/bookings/create.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->passenger_name) &&
    !empty($data->email) &&
    !empty($data->phone) &&
    !empty($data->route_id) &&
    !empty($data->bus_id) &&
    !empty($data->departure_date) &&
    !empty($data->departure_time) &&
    !empty($data->seat_number) &&
    !empty($data->ticket_class) &&
    !empty($data->price)
) {
    $booking_id = "BK" . str_pad(rand(1, 9999), 4, "0", STR_PAD_LEFT);
    
    $query = "INSERT INTO bookings 
              (booking_id, passenger_name, email, phone, route_id, bus_id, 
               departure_date, departure_time, seat_number, ticket_class, price, status)
              VALUES 
              (:booking_id, :passenger_name, :email, :phone, :route_id, :bus_id, 
               :departure_date, :departure_time, :seat_number, :ticket_class, :price, 'confirmed')";

    $stmt = $db->prepare($query);

    $stmt->bindParam(":booking_id", $booking_id);
    $stmt->bindParam(":passenger_name", $data->passenger_name);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":phone", $data->phone);
    $stmt->bindParam(":route_id", $data->route_id);
    $stmt->bindParam(":bus_id", $data->bus_id);
    $stmt->bindParam(":departure_date", $data->departure_date);
    $stmt->bindParam(":departure_time", $data->departure_time);
    $stmt->bindParam(":seat_number", $data->seat_number);
    $stmt->bindParam(":ticket_class", $data->ticket_class);
    $stmt->bindParam(":price", $data->price);

    if($stmt->execute()) {
        // Create ticket
        $ticket_id = "TKT-2026-" . str_pad(rand(1, 9999), 4, "0", STR_PAD_LEFT);
        $booking_db_id = $db->lastInsertId();
        
        $ticket_query = "INSERT INTO tickets (ticket_id, booking_id, status) 
                        VALUES (:ticket_id, :booking_id, 'active')";
        $ticket_stmt = $db->prepare($ticket_query);
        $ticket_stmt->bindParam(":ticket_id", $ticket_id);
        $ticket_stmt->bindParam(":booking_id", $booking_db_id);
        $ticket_stmt->execute();
        
        http_response_code(201);
        echo json_encode([
            "message" => "Booking created successfully.",
            "booking_id" => $booking_id,
            "ticket_id" => $ticket_id
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to create booking."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to create booking. Data is incomplete."]);
}
?>
```

### api/bookings/read.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT 
            b.id,
            b.booking_id,
            b.passenger_name,
            b.email,
            b.phone,
            r.route_from,
            r.route_to,
            bus.bus_number,
            b.departure_date,
            b.departure_time,
            b.seat_number,
            b.ticket_class,
            b.price,
            b.status,
            b.created_at
          FROM bookings b
          LEFT JOIN routes r ON b.route_id = r.id
          LEFT JOIN buses bus ON b.bus_id = bus.id
          ORDER BY b.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$bookings_arr = array();
$bookings_arr["data"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    extract($row);
    
    $booking_item = array(
        "id" => $booking_id,
        "passengerName" => $passenger_name,
        "email" => $email,
        "phone" => $phone,
        "routeFrom" => $route_from,
        "routeTo" => $route_to,
        "busNumber" => $bus_number,
        "departureDate" => date("M d, Y", strtotime($departure_date)),
        "departureTime" => date("h:i A", strtotime($departure_time)),
        "seatNumber" => $seat_number,
        "ticketClass" => $ticket_class,
        "price" => "$" . number_format($price, 2),
        "status" => $status
    );

    array_push($bookings_arr["data"], $booking_item);
}

http_response_code(200);
echo json_encode($bookings_arr);
?>
```

### api/routes/read.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM routes ORDER BY id DESC";
$stmt = $db->prepare($query);
$stmt->execute();

$routes_arr = array();
$routes_arr["data"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    extract($row);
    
    $route_item = array(
        "id" => $id,
        "name" => $route_name,
        "from" => $route_from,
        "to" => $route_to,
        "distance" => $distance_km . " km",
        "duration" => $duration_hours . "h",
        "price" => "$" . number_format($price, 2)
    );

    array_push($routes_arr["data"], $route_item);
}

http_response_code(200);
echo json_encode($routes_arr);
?>
```

### api/buses/read.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM buses ORDER BY id DESC";
$stmt = $db->prepare($query);
$stmt->execute();

$buses_arr = array();
$buses_arr["data"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    extract($row);
    
    $bus_item = array(
        "id" => $id,
        "busNumber" => $bus_number,
        "capacity" => $capacity,
        "status" => $status
    );

    array_push($buses_arr["data"], $bus_item);
}

http_response_code(200);
echo json_encode($buses_arr);
?>
```

### api/tickets/read.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT 
            t.ticket_id,
            b.passenger_name,
            r.route_from,
            r.route_to,
            bus.bus_number,
            b.departure_date,
            b.departure_time,
            b.seat_number,
            b.ticket_class,
            b.price,
            t.status,
            b.created_at as booking_date
          FROM tickets t
          LEFT JOIN bookings b ON t.booking_id = b.id
          LEFT JOIN routes r ON b.route_id = r.id
          LEFT JOIN buses bus ON b.bus_id = bus.id
          WHERE b.status = 'confirmed'
          ORDER BY t.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$tickets_arr = array();
$tickets_arr["data"] = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    extract($row);
    
    $ticket_item = array(
        "id" => $ticket_id,
        "passengerName" => $passenger_name,
        "routeFrom" => $route_from,
        "routeTo" => $route_to,
        "busNumber" => $bus_number,
        "departureDate" => date("M d, Y", strtotime($departure_date)),
        "departureTime" => date("h:i A", strtotime($departure_time)),
        "seatNumber" => $seat_number,
        "ticketClass" => $ticket_class,
        "price" => "$" . number_format($price, 2),
        "status" => $status,
        "bookingDate" => date("M d, Y", strtotime($booking_date))
    );

    array_push($tickets_arr["data"], $ticket_item);
}

http_response_code(200);
echo json_encode($tickets_arr);
?>
```

### api/stats/dashboard.php
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get total bookings
$query = "SELECT COUNT(*) as total FROM bookings";
$stmt = $db->prepare($query);
$stmt->execute();
$total_bookings = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get completed trips
$query = "SELECT COUNT(*) as total FROM bookings WHERE status = 'confirmed'";
$stmt = $db->prepare($query);
$stmt->execute();
$completed_trips = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get pending bookings
$query = "SELECT COUNT(*) as total FROM bookings WHERE status = 'pending'";
$stmt = $db->prepare($query);
$stmt->execute();
$pending_bookings = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get total revenue
$query = "SELECT SUM(price) as total FROM bookings WHERE status = 'confirmed'";
$stmt = $db->prepare($query);
$stmt->execute();
$total_revenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get daily sales for chart (last 7 days)
$query = "SELECT 
            DATE(created_at) as date,
            COUNT(*) as bookings,
            SUM(price) as revenue
          FROM bookings
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC";
$stmt = $db->prepare($query);
$stmt->execute();

$chart_data = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    array_push($chart_data, array(
        "day" => date("D", strtotime($row['date'])),
        "value1" => floatval($row['revenue']),
        "value2" => floatval($row['revenue']) * 0.9
    ));
}

$stats = array(
    "totalBookings" => $total_bookings,
    "completedTrips" => $completed_trips,
    "pendingBookings" => $pending_bookings,
    "totalRevenue" => "$" . number_format($total_revenue, 2),
    "chartData" => $chart_data
);

http_response_code(200);
echo json_encode($stats);
?>
```

## React Integration

To connect the React frontend with this PHP backend, update your fetch calls:

```javascript
// Example: Fetching bookings
const API_URL = "http://localhost/bus-management-backend/api";

async function fetchBookings() {
  try {
    const response = await fetch(`${API_URL}/bookings/read.php`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

// Example: Creating a booking
async function createBooking(bookingData) {
  try {
    const response = await fetch(`${API_URL}/bookings/create.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating booking:", error);
  }
}
```

## Setup Instructions

1. Install XAMPP or any PHP server
2. Create database using the SQL schema above
3. Place PHP files in the htdocs folder
4. Update database credentials in config/database.php
5. Access APIs via: http://localhost/bus-management-backend/api/

## Sample Data Insert

```sql
-- Insert sample buses
INSERT INTO buses (bus_number, capacity, status) VALUES
('BUS-A102', 50, 'active'),
('BUS-B205', 45, 'active'),
('BUS-C310', 50, 'active');

-- Insert sample routes
INSERT INTO routes (route_name, route_from, route_to, distance_km, duration_hours, price) VALUES
('Downtown Express', 'New York Terminal', 'Boston Central', 350, 4.5, 45.00),
('Coastal Route', 'Los Angeles Hub', 'San Francisco Bay', 615, 7.5, 65.00),
('City Connector', 'Chicago Downtown', 'Detroit Station', 450, 5.0, 38.00);
```
