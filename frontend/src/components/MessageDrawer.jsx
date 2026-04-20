import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";

const DEFAULT_CLUB_IMAGE = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=200&q=80";

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

  const activeDraft = useMemo(
    () => ({
      clubId: messageDraft.clubId || "",
      subject: messageDraft.subject || "",
      initialMessage: messageDraft.initialMessage || ""
    }),
    [messageDraft]
  );

  const selectedMessages = Array.isArray(selectedThread?.messages) ? selectedThread.messages : [];
  const selectedClub = clubs.find((club) => club.id === Number(activeDraft.clubId)) || null;

  if (!user || !isMessageDrawerOpen) {
    return null;
  }

  const handleCreateThread = async (event) => {
    event.preventDefault();
    const nextSubject = activeDraft.subject.trim() || "Kulüp İletişimi";

    if (!activeDraft.clubId || !activeDraft.initialMessage.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await createThread({
        clubId: Number(activeDraft.clubId),
        subject: nextSubject,
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
            <div className="stack-list compact-list">
              {threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    className={`thread-list-item thread-list-item-compact ${selectedThreadId === thread.id ? "active" : ""}`}
                    onClick={() => selectThread(thread.id)}
                  >
                    <div className="thread-list-shell">
                      <img className="thread-avatar" src={thread.clubAvatarUrl || DEFAULT_CLUB_IMAGE} alt={thread.clubName} />
                      <div className="thread-list-copy">
                        <div className="thread-list-head">
                          <strong>{thread.clubName}</strong>
                          {thread.unreadCount ? <span className="thread-badge">{thread.unreadCount}</span> : null}
                        </div>
                        <small>{new Date(thread.updatedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</small>
                      </div>
                    </div>
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
              <form className="drawer-compose-form drawer-compose-form-compact" onSubmit={handleCreateThread}>
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
                  Mesajınız
                  <textarea
                    rows="3"
                    value={activeDraft.initialMessage}
                    onChange={(event) => setMessageDraft({ ...activeDraft, initialMessage: event.target.value })}
                    placeholder={`${
                      selectedClub?.name || "Kulüp"
                    } ekibine iletmek istediğiniz kısa mesaj`}
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
                <div className="conversation-header conversation-header-compact">
                  <div className="conversation-club">
                    <img
                      className="thread-avatar thread-avatar-large"
                      src={selectedThread.clubAvatarUrl || DEFAULT_CLUB_IMAGE}
                      alt={selectedThread.clubName}
                    />
                    <div>
                      <strong>{selectedThread.clubName}</strong>
                      <span>{selectedThread.subject || "Kulüp İletişimi"}</span>
                    </div>
                  </div>
                  <span className="pill tone-dark">{selectedMessages.length} mesaj</span>
                </div>

                <div className="conversation-messages">
                  {selectedMessages.map((message) => (
                    <div key={message.id} className={`message-bubble ${message.senderUserId === user.id ? "is-own" : ""}`}>
                      <strong>{message.senderName}</strong>
                      <span>{message.body}</span>
                    </div>
                  ))}
                </div>

                <form className="conversation-reply conversation-reply-compact" onSubmit={handleReply}>
                  <textarea rows="2" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Mesajınızı yazın" />
                  <button className="primary-button" type="submit" disabled={submitting || !reply.trim()}>
                    {submitting ? "Gönderiliyor..." : "Gönder"}
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state-box conversation-empty">
                <strong>Bir konuşma seçin.</strong>
                <span>Soldan mevcut kulüp konuşmalarınızı açabilir veya aşağıdan yeni bir konuşma başlatabilirsiniz.</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
