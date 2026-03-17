<?php
/**
 * Driver Trip Assignment API
 * Handles assigning and removing drivers from trips
 */

error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { 
    http_response_code(200); 
    exit; 
}

$method = $_SERVER["REQUEST_METHOD"];
$input = json_decode(file_get_contents("php://input"), true);

// Ensure driver_trip_assignments table exists
$conn->query("
    CREATE TABLE IF NOT EXISTS driver_trip_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        trip_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT NULL,
        notes TEXT,
        status ENUM('assigned', 'active', 'completed', 'cancelled') DEFAULT 'assigned',
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (driver_id, trip_id)
    ) ENGINE=InnoDB
");

// Also ensure trips table has driver_id column
$result = $conn->query("SHOW COLUMNS FROM trips LIKE 'driver_id'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE trips ADD COLUMN driver_id INT NULL");
    $conn->query("ALTER TABLE trips ADD FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL");
}

// GET - Get all drivers or assignments for a specific trip
if ($method === "GET") {
    $trip_id = isset($_GET["trip_id"]) ? intval($_GET["trip_id"]) : 0;
    $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
    
    // If trip_id provided, get drivers assigned to that trip
    if ($trip_id > 0) {
        $sql = "SELECT 
            dta.id,
            dta.trip_id,
            dta.driver_id,
            dta.status,
            dta.assigned_at,
            u.name as driver_name,
            u.email as driver_email,
            d.license_number,
            d.rating
        FROM driver_trip_assignments dta
        JOIN users u ON u.id = dta.driver_id
        LEFT JOIN drivers d ON d.user_id = u.id
        WHERE dta.trip_id = ?
        ORDER BY dta.assigned_at DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $trip_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $assignments = [];
        while ($row = $result->fetch_assoc()) {
            $assignments[] = $row;
        }
        
        echo json_encode(["status" => "success", "data" => $assignments]);
        exit;
    }
    
    // If driver_id provided, get trips assigned to that driver
    if ($driver_id > 0) {
        $sql = "SELECT 
            dta.id,
            dta.trip_id,
            dta.driver_id,
            dta.status,
            dta.assigned_at,
            t.departure_date,
            t.departure_time,
            r.origin,
            r.destination,
            b.bus_number
        FROM driver_trip_assignments dta
        JOIN trips t ON t.id = dta.trip_id
        JOIN routes r ON r.id = t.route_id
        JOIN buses b ON b.id = t.bus_id
        WHERE dta.driver_id = ?
        ORDER BY t.departure_date DESC, t.departure_time DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $driver_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $assignments = [];
        while ($row = $result->fetch_assoc()) {
            $assignments[] = $row;
        }
        
        echo json_encode(["status" => "success", "data" => $assignments]);
        exit;
    }
    
    // Otherwise, get all available drivers
    $sql = "SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        d.license_number,
        d.status as driver_status,
        d.rating,
        d.total_trips,
        d.assigned_bus_id
    FROM users u
    LEFT JOIN drivers d ON d.user_id = u.id
    WHERE u.role = 'driver'
    ORDER BY u.name ASC";
    
    $result = $conn->query($sql);
    $drivers = [];
    while ($row = $result->fetch_assoc()) {
        $drivers[] = $row;
    }
    
    echo json_encode(["status" => "success", "data" => $drivers]);
    exit;
}

// POST - Assign a driver to a trip
if ($method === "POST") {
    $driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;
    $trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;
    $assigned_by = isset($input["assigned_by"]) ? intval($input["assigned_by"]) : null;
    $notes = isset($input["notes"]) ? trim($input["notes"]) : "";
    
    if ($driver_id <= 0 || $trip_id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "driver_id and trip_id are required"]);
        exit;
    }
    
    // Verify driver exists and has driver role
    $checkDriver = $conn->prepare("SELECT id, role FROM users WHERE id = ? AND role = 'driver'");
    $checkDriver->bind_param("i", $driver_id);
    $checkDriver->execute();
    $driverResult = $checkDriver->get_result();
    
    if ($driverResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid driver ID or user is not a driver"]);
        exit;
    }
    
    // Verify trip exists
    $checkTrip = $conn->prepare("SELECT id FROM trips WHERE id = ?");
    $checkTrip->bind_param("i", $trip_id);
    $checkTrip->execute();
    $tripResult = $checkTrip->get_result();
    
    if ($tripResult->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid trip ID"]);
        exit;
    }
    
    // Check if assignment already exists
    $checkExisting = $conn->prepare("SELECT id FROM driver_trip_assignments WHERE driver_id = ? AND trip_id = ?");
    $checkExisting->bind_param("ii", $driver_id, $trip_id);
    $checkExisting->execute();
    $existingResult = $checkExisting->get_result();
    
    if ($existingResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Driver is already assigned to this trip"]);
        exit;
    }
    
    // Create assignment
    $stmt = $conn->prepare("INSERT INTO driver_trip_assignments (driver_id, trip_id, assigned_by, notes, status) VALUES (?, ?, ?, ?, 'assigned')");
    $stmt->bind_param("iiis", $driver_id, $trip_id, $assigned_by, $notes);
    
    if ($stmt->execute()) {
        // Also update the trips table driver_id for backward compatibility
        $updateTrip = $conn->prepare("UPDATE trips SET driver_id = ? WHERE id = ?");
        $updateTrip->bind_param("ii", $driver_id, $trip_id);
        $updateTrip->execute();
        
        echo json_encode([
            "status" => "success", 
            "message" => "Driver assigned to trip successfully",
            "data" => ["assignment_id" => $conn->insert_id]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to assign driver", "details" => $stmt->error]);
    }
    exit;
}

// PUT - Update assignment status or reassign
if ($method === "PUT") {
    $assignment_id = isset($input["assignment_id"]) ? intval($input["assignment_id"]) : 0;
    $driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;
    $trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;
    $status = isset($input["status"]) ? trim($input["status"]) : "";
    
    if ($assignment_id <= 0 && ($driver_id <= 0 || $trip_id <= 0)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "assignment_id or (driver_id and trip_id) are required"]);
        exit;
    }
    
    $updates = [];
    $params = [];
    $types = "";
    
    if (!empty($status)) {
        $allowed_status = ["assigned", "active", "completed", "cancelled"];
        if (in_array($status, $allowed_status)) {
            $updates[] = "status = ?";
            $params[] = $status;
            $types .= "s";
        }
    }
    
    if (count($updates) > 0) {
        if ($assignment_id > 0) {
            $params[] = $assignment_id;
            $types .= "i";
            $sql = "UPDATE driver_trip_assignments SET " . implode(", ", $updates) . " WHERE id = ?";
        } else {
            $params[] = $driver_id;
            $params[] = $trip_id;
            $types .= "ii";
            $sql = "UPDATE driver_trip_assignments SET " . implode(", ", $updates) . " WHERE driver_id = ? AND trip_id = ?";
        }
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Assignment updated successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to update assignment"]);
        }
    } else {
        echo json_encode(["status" => "success", "message" => "No changes to update"]);
    }
    exit;
}

// DELETE - Remove driver from trip
if ($method === "DELETE") {
    $input = json_decode(file_get_contents("php://input"), true);
    $assignment_id = isset($input["assignment_id"]) ? intval($input["assignment_id"]) : 0;
    $driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;
    $trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;
    
    if ($assignment_id <= 0 && ($driver_id <= 0 || $trip_id <= 0)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "assignment_id or (driver_id and trip_id) are required"]);
        exit;
    }
    
    if ($assignment_id > 0) {
        $stmt = $conn->prepare("DELETE FROM driver_trip_assignments WHERE id = ?");
        $stmt->bind_param("i", $assignment_id);
    } else {
        $stmt = $conn->prepare("DELETE FROM driver_trip_assignments WHERE driver_id = ? AND trip_id = ?");
        $stmt->bind_param("ii", $driver_id, $trip_id);
        
        // Also clear the driver_id from trips table
        $updateTrip = $conn->prepare("UPDATE trips SET driver_id = NULL WHERE driver_id = ? AND id = ?");
        $updateTrip->bind_param("ii", $driver_id, $trip_id);
        $updateTrip->execute();
    }
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Driver removed from trip successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to remove assignment"]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
