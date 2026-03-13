<?php
// Setup notifications table

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$host = 'localhost';
$dbname = 'bus_system';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Create notifications table
$sql = "
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'cancellation', 'reminder', 'system', 'promotion', 'admin') DEFAULT 'system',
    reference_type VARCHAR(50),
    reference_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $pdo->exec($sql);
    
    // Insert sample notifications
    $sampleNotifications = [
        // Passenger notifications (user_id = 3)
        [3, 'Welcome to CamTransit!', 'Your account has been created successfully. Start booking your first trip today!', 'system', 0],
        [3, 'Booking Confirmed', 'Your trip from Douala to Yaoundé on March 15th is confirmed!', 'booking', 0],
        [3, 'Trip Reminder', 'Your trip departs tomorrow at 8:00 AM. Please arrive 30 minutes early.', 'reminder', 1],
        
        // Admin notifications (user_id = 1)
        [1, 'New Booking', 'John Doe booked Douala to Yaoundé for March 15th', 'booking', 0],
        [1, 'New User Registration', 'Alice Passenger registered as a new user', 'system', 0],
        [1, 'Trip Completed', 'Bus BK-001 completed trip from Douala to Bafoussam', 'system', 1],
        [1, 'Low Seat Alert', 'Bus to Bamenda has only 3 seats remaining', 'system', 1],
    ];
    
    $insertStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    foreach ($sampleNotifications as $notif) {
        try {
            $insertStmt->execute($notif);
        } catch (PDOException $e) {
            // Ignore duplicate insert errors
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Notifications table created successfully with sample data'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Failed to create notifications table: ' . $e->getMessage()
    ]);
}
