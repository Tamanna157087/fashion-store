import { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";

const AdminNotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch("/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
        title="Admin Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-gray-100 shadow-2xl z-50 text-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-gray-900 text-sm">Notification Center ({unreadCount} unread)</h4>
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 rounded-2xl transition border ${
                    !n.isRead ? "bg-indigo-50/70 border-indigo-100" : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="font-bold text-gray-900 flex justify-between">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationCenter;
