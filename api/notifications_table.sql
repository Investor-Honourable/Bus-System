-- Notifications Table
-- Stores all notifications for users
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
);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES 
(3, 'Welcome to CamTransit!', 'Your account has been created successfully. Start booking your first trip today!', 'system', FALSE, NOW() - INTERVAL 2 MINUTE),
(3, 'Booking Confirmed', 'Your trip from Douala to Yaoundé on March 15th is confirmed!', 'booking', FALSE, NOW() - INTERVAL 30 MINUTE),
(3, 'Trip Reminder', 'Your trip departs tomorrow at 8:00 AM. Please arrive 30 minutes early.', 'reminder', TRUE, NOW() - INTERVAL 1 DAY);

-- Admin notifications (for user_id = 1 which is admin)
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES 
(1, 'New Booking', 'John Doe booked Douala to Yaoundé for March 15th', 'booking', FALSE, NOW() - INTERVAL 5 MINUTE),
(1, 'New User Registration', 'Alice Passenger registered as a new user', 'system', FALSE, NOW() - INTERVAL 30 MINUTE),
(1, 'Trip Completed', 'Bus BK-001 completed trip from Douala to Bafoussam', 'system', TRUE, NOW() - INTERVAL 1 HOUR),
(1, 'Low Seat Alert', 'Bus to Bamenda has only 3 seats remaining', 'system', TRUE, NOW() - INTERVAL 2 HOUR);
