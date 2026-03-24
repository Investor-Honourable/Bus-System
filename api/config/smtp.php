<?php
/**
 * SMTP Configuration for CamTransit - Gmail Setup
 * 
 * Follow these steps to set up Gmail:
 * 
 * STEP 1: Enable 2-Step Verification
 * - Go to: https://myaccount.google.com/security
 * - Sign in with your Gmail
 * - Find "2-Step Verification" and turn it ON
 * 
 * STEP 2: Create App Password
 * - After enabling 2-Step Verification, search "App Passwords" in Google search
 * - Or go to: https://myaccount.google.com/apppasswords
 * - Select "Mail" as the app
 * - Select "Other" and name it "CamTransit"
 * - Copy the 16-character password shown (xxxx xxxx xxxx xxxx)
 * 
 * STEP 3: Update below
 * - Replace 'metugejamila@gmail.com' with your Gmail
 * - Replace 'YOUR_16_CHAR_APP_PASSWORD' with the App Password you just created
 */

return [
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'metugejamila@gmail.com',      // ← Replace with your Gmail
        'password' => 'jios uskd fbfp lckq',   // ← Replace with App Password
        'encryption' => 'tls',
        'from_email' => 'metugejamila@gmail.com',
        'from_name' => 'CamTransit',
    ],
    
    'enabled' => true,
    'dev_mode' => false,
];
