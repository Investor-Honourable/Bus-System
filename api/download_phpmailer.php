<?php
/**
 * Download PHPMailer library
 * Run this script to download PHPMailer
 */

$phpmailerDir = __DIR__ . '/vendor/phpmailer/phpmailer';

if (is_dir($phpmailerDir)) {
    echo "PHPMailer already installed!\n";
    exit;
}

// Create vendor directory
if (!is_dir(__DIR__ . '/vendor')) {
    mkdir(__DIR__ . '/vendor', 0755, true);
}

// Download PHPMailer from GitHub using ZIP
$zipUrl = 'https://github.com/PHPMailer/PHPMailer/archive/refs/tags/v6.9.1.zip';
$zipFile = __DIR__ . '/phpmailer.zip';

echo "Downloading PHPMailer...\n";

$content = file_get_contents($zipUrl);
if ($content === false) {
    echo "Failed to download PHPMailer. Please download manually from:\n";
    echo "https://github.com/PHPMailer/PHPMailer/archive/refs/tags/v6.9.1.zip\n";
    echo "Extract the contents to: " . __DIR__ . "/vendor/phpmailer/\n";
    exit;
}

file_put_contents($zipFile, $content);
echo "Downloaded PHPMailer ZIP\n";

// Extract ZIP
$zip = new ZipArchive();
if ($zip->open($zipFile) === true) {
    $zip->extractTo(__DIR__ . '/vendor/');
    $zip->close();
    
    // Rename folder
    if (is_dir(__DIR__ . '/vendor/PHPMailer-6.9.1')) {
        rename(__DIR__ . '/vendor/PHPMailer-6.9.1', __DIR__ . '/vendor/phpmailer');
    }
    
    echo "Extracted PHPMailer successfully!\n";
} else {
    echo "Failed to extract ZIP. Please download and extract manually.\n";
}

// Clean up
if (is_file($zipFile)) {
    unlink($zipFile);
}

echo "PHPMailer is ready to use!\n";
