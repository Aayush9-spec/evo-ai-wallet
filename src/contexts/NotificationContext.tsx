
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  sendLocalNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("Sentient SW Registered:", reg.scope))
        .catch(err => console.error("SW Registration Failed:", err));
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser does not support notifications.");
      return;
    }

    const res = await Notification.requestPermission();
    setPermission(res);
    
    if (res === "granted") {
      toast.success("Neural Notifications: ENABLED");
      // Send a welcome notification
      sendLocalNotification("Neural Link Established", "The AI is now monitoring your wealth in real-time.");
    } else {
      toast.error("Neural Notifications: DISABLED");
    }
  };

  const sendLocalNotification = (title: string, body: string) => {
    if (permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: "/favicon.ico",
          vibrate: [200, 100, 200],
          tag: 'evo-alert'
        });
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, sendLocalNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
