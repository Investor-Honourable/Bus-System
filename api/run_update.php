<?php
/**
 * Run Driver Credentials Update via Web
 * Access this file via browser to update driver credentials
 */

require_once 'config/db.php';

// New credentials for both driver accounts
$driverUpdates = [
    [
        'old_email' => 'driver@camtransit.com',
        'new_username' => 'johndriver',
        'new_email' => 'john.driver@camtransit.com',
        'new_password' => 'driver1234'
    ],
    [
        'old_email' => 'marie.driver@camtransit.com',
        'new_username' => 'mariedriver',
        'new_email' => 'marie.driver@camtransit.com',
        'new_password' => 'driver1234'
    ]
];

echo "<h1>Updating Driver Credentials</h1>";
echo "<pre>";

foreach ($driverUpdates as $update) {
    $old_email = $update['old_email'];
    $new_username = $update['new_username'];
    $new_email = $update['new_email'];
    $new_password = $update['new_password'];
    
    // Hash the new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ? AND role = 'driver'");
    $stmt->bind_param("s", $old_email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        echo "ERROR: Driver account not found for email: $old_email\n";
        continue;
    }
    
    // Update user credentials
    $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?");
    $stmt->bind_param("sssi", $new_username, $new_email, $hashed_password, $user['id']);
    
    if ($stmt->execute()) {
        echo "SUCCESS: Updated credentials for {$user['name']}\n";
        echo "  - Old email: $old_email\n";
        echo "  - New username: $new_username\n";
        echo "  - New email: $new_email\n";
        echo "  - New password: $new_password\n\n";
    } else {
        echo "ERROR: Failed to update credentials for {$user['name']}: " . $stmt->error . "\n\n";
    }
}

echo "</pre>";
echo "<h2>Done!</h2>";
echo "<p>You can now login with the new credentials.</p>";
?>
