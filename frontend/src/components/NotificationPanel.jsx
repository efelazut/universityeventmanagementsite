import { useCommunicationCenter } from "../context/CommunicationCenterContext";

export function NotificationPanel() {
  const { notifications, isNotificationPanelOpen, closeNotifications, markNotification, openMessages } = useCommunicationCenter();

  if (!isNotificationPanelOpen) {
    return null;
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotification(notification.id);
    }

    if (notification.relatedLink?.startsWith("/messages")) {
      const params = new URLSearchParams(notification.relatedLink.split("?")[1] || "");
      await openMessages({ threadId: params.get("thread") });
      closeNotifications();
      return;
    }
  };

  return (
    <>
      <button className="drawer-backdrop drawer-backdrop-light" onClick={closeNotifications} aria-label="Bildirim panelini kapat" />
      <aside className="notification-panel">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Bildirimler</p>
            <h3>Güncel hareketler</h3>
          </div>
          <button className="ghost-button" onClick={closeNotifications}>
            Kapat
          </button>
        </div>

        <div className="stack-list">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                className={`list-row notification-row ${notification.isRead ? "notification-read" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-copy">
                  <div className="thread-list-head">
                    <strong>{notification.title}</strong>
                    {!notification.isRead ? <span className="thread-badge">Yeni</span> : null}
                  </div>
                  <span>{notification.message}</span>
                  <small>
                    {new Date(notification.createdAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </small>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state-box">
              <strong>Yeni bildiriminiz yok.</strong>
              <span>Etkinlikler, başvurular ve mesaj hareketleri burada listelenecek.</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
