<?php
// Create driver notifications table
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/config/db.php';

// Check if table exists
$result = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
if ($result->num_rows > 0) {
    echo json_encode(["status" => "success", "message" => "Table already exists"]);
    exit;
}

// Create table
$sql = "
CREATE TABLE IF NOT EXISTS driver_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    trip_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_id (driver_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "message" => "Table created successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
