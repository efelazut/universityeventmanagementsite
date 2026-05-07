import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  createMessageThread,
  fetchMessageThread,
  fetchMessageThreads,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendThreadMessage
} from "../services/resourceService";

const CommunicationCenterContext = createContext(null);

export function CommunicationCenterProvider({ children }) {
  const { user, apiBaseUrl } = useAuth();
  const threadsQuery = useAsyncData(
    () => (user?.token ? fetchMessageThreads(user.token, apiBaseUrl) : Promise.resolve([])),
    [user?.token, apiBaseUrl]
  );
  const notificationsQuery = useAsyncData(
    () => (user?.token ? fetchNotifications(user.token, apiBaseUrl) : Promise.resolve([])),
    [user?.token, apiBaseUrl]
  );
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [messageDraft, setMessageDraft] = useState({ clubId: "", subject: "", initialMessage: "" });

  const threads = Array.isArray(threadsQuery.data) ? threadsQuery.data : [];
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const unreadMessageCount = threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0);
  const unreadNotificationCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (!user) {
      setIsMessageDrawerOpen(false);
      setIsNotificationPanelOpen(false);
      setSelectedThreadId(null);
      setSelectedThread(null);
      setMessageDraft({ clubId: "", subject: "", initialMessage: "" });
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadThread = async () => {
      if (!user?.token || !selectedThreadId || !isMessageDrawerOpen) {
        if (active) {
          setSelectedThread(null);
          setThreadError("");
        }
        return;
      }

      setThreadLoading(true);
      setThreadError("");

      try {
        const thread = await fetchMessageThread(selectedThreadId, user.token, apiBaseUrl);
        if (!active) {
          return;
        }

        setSelectedThread(thread);
        await threadsQuery.reload();
      } catch (error) {
        if (active) {
          setThreadError(error.message || "Sohbet yüklenemedi.");
          setSelectedThread(null);
        }
      } finally {
        if (active) {
          setThreadLoading(false);
        }
      }
    };

    loadThread();

    return () => {
      active = false;
    };
  }, [selectedThreadId, isMessageDrawerOpen, user?.token, apiBaseUrl]);

  const openMessages = async (options = {}) => {
    if (!user?.token) {
      return false;
    }

    const nextThreads = Array.isArray(threadsQuery.data) ? threadsQuery.data : [];
    const matchingThread = options.threadId
      ? nextThreads.find((thread) => thread.id === Number(options.threadId))
      : options.clubId
        ? nextThreads.find((thread) => thread.clubId === Number(options.clubId))
        : nextThreads[0];

    setIsNotificationPanelOpen(false);
    setIsMessageDrawerOpen(true);
    setSelectedThreadId(matchingThread?.id ?? null);
    setMessageDraft({
      clubId: options.clubId ? String(options.clubId) : "",
      subject: options.subject || "",
      initialMessage: options.initialMessage || ""
    });
    return true;
  };

  const closeMessages = () => {
    setIsMessageDrawerOpen(false);
    setThreadError("");
  };

  const openNotifications = async () => {
    if (!user?.token) {
      return false;
    }

    setIsMessageDrawerOpen(false);
    setIsNotificationPanelOpen(true);

    if (unreadNotificationCount) {
      await markAllNotificationsRead(user.token, apiBaseUrl);
      await notificationsQuery.reload();
    }

    return true;
  };

  const closeNotifications = () => setIsNotificationPanelOpen(false);

  const selectThread = (threadId) => {
    setSelectedThreadId(threadId);
    setMessageDraft({ clubId: "", subject: "", initialMessage: "" });
  };

  const sendReply = async (body) => {
    if (!selectedThreadId || !user?.token) {
      return null;
    }

    const updated = await sendThreadMessage(selectedThreadId, { body }, user.token, apiBaseUrl);
    setSelectedThread(updated);
    await threadsQuery.reload();
    return updated;
  };

  const createThread = async (payload) => {
    if (!user?.token) {
      return null;
    }

    const created = await createMessageThread(payload, user.token, apiBaseUrl);
    setSelectedThreadId(created.id);
    setSelectedThread(created);
    setMessageDraft({ clubId: "", subject: "", initialMessage: "" });
    await threadsQuery.reload();
    return created;
  };

  const markNotification = async (id) => {
    if (!user?.token) {
      return;
    }

    await markNotificationRead(id, user.token, apiBaseUrl);
    await notificationsQuery.reload();
  };

  const value = useMemo(
    () => ({
      threads,
      notifications,
      selectedThread,
      selectedThreadId,
      threadLoading,
      threadError,
      isMessageDrawerOpen,
      isNotificationPanelOpen,
      unreadMessageCount,
      unreadNotificationCount,
      messageDraft,
      openMessages,
      closeMessages,
      openNotifications,
      closeNotifications,
      selectThread,
      sendReply,
      createThread,
      setMessageDraft,
      markNotification,
      reloadThreads: threadsQuery.reload,
      reloadNotifications: notificationsQuery.reload
    }),
    [
      threads,
      notifications,
      selectedThread,
      selectedThreadId,
      threadLoading,
      threadError,
      isMessageDrawerOpen,
      isNotificationPanelOpen,
      unreadMessageCount,
      unreadNotificationCount,
      messageDraft
    ]
  );

  return <CommunicationCenterContext.Provider value={value}>{children}</CommunicationCenterContext.Provider>;
}

export function useCommunicationCenter() {
  const context = useContext(CommunicationCenterContext);
  if (!context) {
    throw new Error("useCommunicationCenter must be used inside CommunicationCenterProvider");
  }

  return context;
}
