<?php
/**
 * SMTP Mailer using PHP streams
 */

class Mailer {
    private $smtpConfig;
    private $debug = true;
    
    public function __construct() {
        $config = require __DIR__ . '/smtp.php';
        $this->smtpConfig = $config['smtp'];
    }
    
    public function send($toEmail, $toName, $subject, $body) {
        $smtp = $this->smtpConfig;
        
        $this->log("Starting SMTP to " . $smtp['host']);
        
        $host = $smtp['host'];
        $port = $smtp['port'];
        
        $fp = @fsockopen($host, $port, $errno, $errstr, 30);
        
        if (!$fp) {
            $this->log("Connection failed: $errstr ($errno)");
            return $this->fallbackMail($toEmail, $subject, $body);
        }
        
        $response = fgets($fp, 515);
        $this->log("Response: $response");
        
        if (substr($response, 0, 3) != '220') {
            fclose($fp);
            return $this->fallbackMail($toEmail, $subject, $body);
        }
        
        fwrite($fp, "EHLO localhost\r\n");
        fgets($fp, 515);
        
        fwrite($fp, "AUTH LOGIN\r\n");
        fgets($fp, 515);
        
        fwrite($fp, base64_encode($smtp['username']) . "\r\n");
        fgets($fp, 515);
        
        fwrite($fp, base64_encode($smtp['password']) . "\r\n");
        $response = fgets($fp, 515);
        
        if (substr($response, 0, 3) != '235') {
            $this->log("Auth failed: $response");
            fclose($fp);
            return $this->fallbackMail($toEmail, $subject, $body);
        }
        
        fwrite($fp, "MAIL FROM:<" . $smtp['from_email'] . ">\r\n");
        fgets($fp, 515);
        
        fwrite($fp, "RCPT TO:<$toEmail>\r\n");
        fgets($fp, 515);
        
        fwrite($fp, "DATA\r\n");
        $response = fgets($fp, 515);
        
        $fromName = $smtp['from_name'];
        $fromEmail = $smtp['from_email'];
        
        $message = "From: $fromName <$fromEmail>\r\n";
        $message .= "To: $toName <$toEmail>\r\n";
        $message .= "Subject: $subject\r\n";
        $message .= "MIME-Version: 1.0\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "\r\n$body\r\n.\r\n";
        
        fwrite($fp, $message);
        $response = fgets($fp, 515);
        
        fwrite($fp, "QUIT\r\n");
        fclose($fp);
        
        $success = (substr($response, 0, 3) == '250');
        $this->log("Send result: " . ($success ? 'SUCCESS' : 'FAILED'));
        
        return $success;
    }
    
    private function log($msg) {
        if ($this->debug) {
            error_log("[Mailer] " . $msg);
        }
    }
    
    private function fallbackMail($toEmail, $subject, $body) {
        $this->log("Using PHP mail() fallback");
        $headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: CamTransit <investorhonourable01@gmail.com>\r\n";
        
        return mail($toEmail, $subject, $body, $headers);
    }
}