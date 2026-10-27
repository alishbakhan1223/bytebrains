"use client";

import { useEffect, useState, useRef, useCallback, createContext, useContext } from "react";
import { getAuthToken, api } from "@/lib/api";

export interface RealtimeMessage {
  id?: string;
  type: string;
  title: string;
  message: string;
  severity?: "critical" | "warning" | "success" | "info";
  timestamp?: string;
  request_id?: number;
  priority?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  notifications: RealtimeMessage[];
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  notifications: [],
  dismissNotification: () => {},
  clearAll: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Helper to poll notifications endpoint (used on serverless/Vercel or WS failure)
  const pollNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    try {
      const data = await api.getNotifications({ limit: 20 });
      if (Array.isArray(data)) {
        setIsConnected(true);
        const mapped: RealtimeMessage[] = data.map((n: any) => ({
          id: String(n.id),
          type: n.type || "NOTIFICATION",
          title: (n.type || "Notification").replace(/_/g, " "),
          message: n.message,
          severity: n.type?.includes("CRITICAL") ? "critical" : (n.type?.includes("ALERT") ? "warning" : "info"),
          timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      // Ignore network errors during polling
    }
  }, []);

  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    // In deployed/serverless environments without WebSocket support, rely on periodic polling
    if (!isLocal) {
      isPollingRef.current = true;
      pollNotifications();
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const wsUrl = apiBase.replace(/^http/, "ws") + `/ws?token=${encodeURIComponent(token)}`;

      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        isPollingRef.current = false;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CONNECTION_ESTABLISHED") {
            return;
          }

          const notificationWithId: RealtimeMessage = {
            ...data,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: data.timestamp || new Date().toLocaleTimeString(),
          };

          setNotifications((prev) => [notificationWithId, ...prev.slice(0, 19)]); // Keep latest 20
        } catch (e) {
          // non-json or ping-pong
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Fall back to polling if closed or failed
        if (!isPollingRef.current) {
          isPollingRef.current = true;
          pollNotifications();
        }
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 4000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      setIsConnected(false);
      isPollingRef.current = true;
      pollNotifications();
    }
  }, [pollNotifications]);

  useEffect(() => {
    connect();

    // Check connection / poll notifications every 15s on deployed sites
    const interval = setInterval(() => {
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (!isLocal || isPollingRef.current) {
        pollNotifications();
      } else if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect, pollNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        notifications,
        dismissNotification,
        clearAll,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useRealtimeNotifications() {
  return useContext(WebSocketContext);
}
