<?php
/**
 * Quick setup for password reset tokens table
 * Run this file once to create the table
 */

header('Content-Type: text/plain');

require_once __DIR__ . '/config/db.php';

try {
    // Create password_reset_tokens table
    $sql = "CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id)
    )";
    
    $pdo->exec($sql);
    echo "Password reset tokens table created successfully!\n";
    
    // Create logs directory if it doesn't exist
    if (!is_dir(__DIR__ . '/logs')) {
        mkdir(__DIR__ . '/logs', 0755, true);
        echo "Logs directory created!\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
