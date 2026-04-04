import { useState, useEffect, useCallback } from 'react';

const API_URL = '/api/notifications.php';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_URL}?action=list`, {
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}?action=mark_read`, {
        method: 'PUT',
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_id: notificationId, user_id: userId })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}?action=mark_all_read`, {
        method: 'PUT',
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Create a notification (for triggering on user actions)
  const createNotification = async (notificationData) => {
    try {
      const response = await fetch(`${API_URL}?action=create`, {
        method: 'POST',
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        // Refresh notifications
        fetchNotifications();
      }
      
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return { status: 'error', message: error.message };
    }
  };

  // Initial fetch and set up polling for real-time updates
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  };
}
