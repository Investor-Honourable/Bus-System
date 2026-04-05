<?php
require 'config/db.php';

$result = $conn->query("DESCRIBE users");
$hasColumn = false;
while ($row = $result->fetch_assoc()) {
    if ($row['Field'] === 'profile_picture') {
        $hasColumn = true;
        break;
    }
}

if (!$hasColumn) {
    $conn->query("ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT NULL");
    echo "Column added";
} else {
    echo "Column already exists";
}