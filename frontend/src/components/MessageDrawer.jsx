import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";

export function MessageDrawer({ clubs = [] }) {
  const { user } = useAuth();
  const {
    threads,
    selectedThread,
    selectedThreadId,
    threadLoading,
    threadError,
    isMessageDrawerOpen,
    messageDraft,
    closeMessages,
    selectThread,
    sendReply,
    createThread,
    setMessageDraft
  } = useCommunicationCenter();
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedMessages = Array.isArray(selectedThread?.messages) ? selectedThread.messages : [];
  const activeDraft = useMemo(
    () => ({
      clubId: messageDraft.clubId || "",
      subject: messageDraft.subject || "",
      initialMessage: messageDraft.initialMessage || ""
    }),
    [messageDraft]
  );

  if (!user || !isMessageDrawerOpen) {
    return null;
  }

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!activeDraft.clubId || !activeDraft.subject.trim() || !activeDraft.initialMessage.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await createThread({
        clubId: Number(activeDraft.clubId),
        subject: activeDraft.subject.trim(),
        initialMessage: activeDraft.initialMessage.trim()
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await sendReply(reply.trim());
      setReply("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="drawer-backdrop" onClick={closeMessages} aria-label="Mesaj panelini kapat" />
      <aside className="message-drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Mesajlar</p>
            <h3>Kulüplerle hızlı iletişim</h3>
          </div>
          <button className="ghost-button" onClick={closeMessages}>
            Kapat
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-thread-list">
            <div className="drawer-section-title">Konuşmalar</div>
            <div className="stack-list">
              {threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    className={`thread-list-item ${selectedThreadId === thread.id ? "active" : ""}`}
                    onClick={() => selectThread(thread.id)}
                  >
                    <div className="thread-list-head">
                      <strong>{thread.subject}</strong>
                      {thread.unreadCount ? <span className="thread-badge">{thread.unreadCount}</span> : null}
                    </div>
                    <span>{thread.clubName}</span>
                    <small>{thread.lastMessagePreview || "Henüz mesaj yok."}</small>
                  </button>
                ))
              ) : (
                <div className="empty-state-box">
                  <strong>Henüz sohbet yok.</strong>
                  <span>Bir kulübe mesaj bıraktığınızda konuşmalar burada listelenecek.</span>
                </div>
              )}
            </div>

            {user.role === "Student" ? (
              <form className="drawer-compose-form" onSubmit={handleCreateThread}>
                <div className="drawer-section-title">Yeni konuşma</div>
                <label>
                  Kulüp
                  <select value={activeDraft.clubId} onChange={(event) => setMessageDraft({ ...activeDraft, clubId: event.target.value })}>
                    <option value="">Kulüp seçin</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Konu
                  <input value={activeDraft.subject} onChange={(event) => setMessageDraft({ ...activeDraft, subject: event.target.value })} />
                </label>
                <label>
                  İlk mesaj
                  <textarea
                    rows="4"
                    value={activeDraft.initialMessage}
                    onChange={(event) => setMessageDraft({ ...activeDraft, initialMessage: event.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={submitting}>
                  {submitting ? "Gönderiliyor..." : "Konuşma Başlat"}
                </button>
              </form>
            ) : null}
          </div>

          <div className="drawer-conversation">
            {threadLoading ? <div className="loading-state">Konuşma yükleniyor...</div> : null}
            {threadError ? <div className="error-panel">{threadError}</div> : null}
            {selectedThread ? (
              <>
                <div className="conversation-header">
                  <strong>{selectedThread.subject}</strong>
                  <span>{selectedThread.clubName}</span>
                </div>
                <div className="conversation-messages">
                  {selectedMessages.map((message) => (
                    <div key={message.id} className={`message-bubble ${message.senderUserId === user.id ? "is-own" : ""}`}>
                      <strong>{message.senderName}</strong>
                      <span>{message.body}</span>
                    </div>
                  ))}
                </div>
                <form className="conversation-reply" onSubmit={handleReply}>
                  <textarea rows="3" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Mesajınızı yazın" />
                  <button className="primary-button" type="submit" disabled={submitting || !reply.trim()}>
                    {submitting ? "Gönderiliyor..." : "Gönder"}
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state-box">
                <strong>Bir konuşma seçin.</strong>
                <span>Soldan mevcut konuşmalardan birini açabilir veya yeni konuşma başlatabilirsiniz.</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
