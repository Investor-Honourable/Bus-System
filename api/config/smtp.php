<?php
/**
 * SMTP Configuration for CamTransit - Gmail Setup
 */

return [
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'investorhonourable01@gmail.com',
        'password' => 'piwptjewjispaddy',
        'encryption' => 'tls',
        'from_email' => 'investorhonourable01@gmail.com',
        'from_name' => 'CamTransit',
    ],
    
    'enabled' => true,
    'dev_mode' => false,
];