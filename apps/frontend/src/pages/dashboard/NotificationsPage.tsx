import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCircle2, RefreshCw } from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface Notification {
  id: string;
  doctor_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.items);
    } catch (err: any) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, userType, fetchNotifications]);

  const markAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error("Failed to mark as read");
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-gray-400" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} notification{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {markingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucune notification</h3>
            <p className="text-sm text-gray-500 mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors ${
                  !notif.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    {notif.is_read ? (
                      <CheckCircle2 className="h-6 w-6 text-gray-300" />
                    ) : (
                      <div className="h-3 w-3 mt-1.5 rounded-full bg-primary ring-4 ring-primary/20" />
                    )}
                  </div>
                  <div>
                    <p className={`text-base ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    disabled={markingId === notif.id}
                    className="shrink-0 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 sm:ml-4 flex items-center gap-1.5"
                  >
                    {markingId === notif.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Marquer lu
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
