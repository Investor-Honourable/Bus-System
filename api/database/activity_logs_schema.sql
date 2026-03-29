-- Activity Logs Table Schema
-- This table stores all system activity for audit trail and monitoring

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `activity_type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_activity` (`user_id`, `activity_type`),
  KEY `idx_date_activity` (`DATE(created_at)`, `activity_type`),
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample activity types for reference
-- User activities
-- 'user_login', 'user_logout', 'user_registration', 'user_profile_update', 'user_password_change'

-- Booking activities
-- 'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed', 'booking_refunded'

-- Admin activities
-- 'admin_user_created', 'admin_user_updated', 'admin_user_deleted', 'admin_role_changed'
-- 'admin_bus_created', 'admin_bus_updated', 'admin_bus_deleted'
-- 'admin_route_created', 'admin_route_updated', 'admin_route_deleted'
-- 'admin_schedule_created', 'admin_schedule_updated', 'admin_schedule_deleted'

-- System activities
-- 'system_backup', 'system_maintenance', 'system_error', 'system_alert'

-- Driver activities
-- 'driver_trip_started', 'driver_trip_completed', 'driver_ticket_verified', 'driver_status_updated'

-- Create index for faster queries
CREATE INDEX idx_activity_logs_composite ON activity_logs (created_at DESC, activity_type, user_id);

-- Create view for recent activity
CREATE OR REPLACE VIEW recent_activity_view AS
SELECT 
    al.id,
    al.activity_type,
    al.description,
    al.ip_address,
    al.created_at,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY al.created_at DESC;

-- Create view for activity statistics
CREATE OR REPLACE VIEW activity_stats_view AS
SELECT 
    DATE(created_at) as activity_date,
    activity_type,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users
FROM activity_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), activity_type
ORDER BY activity_date DESC, activity_count DESC;
