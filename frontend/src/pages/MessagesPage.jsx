import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  createMessageThread,
  fetchClubs,
  fetchMessageThread,
  fetchMessageThreads,
  sendThreadMessage
} from "../services/resourceService";

export function MessagesPage() {
  const { apiBaseUrl, user } = useAuth();
  const threadsQuery = useAsyncData(() => fetchMessageThreads(user.token, apiBaseUrl), [user?.token, apiBaseUrl]);
  const clubsQuery = useAsyncData(() => fetchClubs(apiBaseUrl), [apiBaseUrl]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [compose, setCompose] = useState({ clubId: "", subject: "", initialMessage: "" });
  const [reply, setReply] = useState("");

  const messagesEndRef = useRef(null);

  const threads = Array.isArray(threadsQuery.data) ? threadsQuery.data : [];
  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data : [];
  
  const uniqueClubs = useMemo(() => {
    const seen = new Set();
    return clubs.filter(club => {
      if (seen.has(club.id)) return false;
      seen.add(club.id);
      return true;
    });
  }, [clubs]);

  const selectedMessages = Array.isArray(selectedThread?.messages) ? selectedThread.messages : [];
  const totalUnreadCount = useMemo(
    () => threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0),
    [threads]
  );

  useEffect(() => {
    if (!threads.length) {
      setSelectedId(null);
      setSelectedThread(null);
      return;
    }

    const hasSelectedThread = threads.some((thread) => thread.id === selectedId);
    if (!selectedId || !hasSelectedThread) {
      setSelectedId(threads[0].id);
    }
  }, [selectedId, threads]);

  useEffect(() => {
    let isMounted = true;

    const loadThread = async () => {
      if (!selectedId) {
        if (isMounted) {
          setSelectedThread(null);
          setThreadError("");
        }
        return;
      }

      setThreadLoading(true);
      setThreadError("");

      try {
        const data = await fetchMessageThread(selectedId, user.token, apiBaseUrl);
        if (!isMounted) {
          return;
        }

        setSelectedThread(data);
        await threadsQuery.reload();
      } catch (error) {
        if (isMounted) {
          setSelectedThread(null);
          setThreadError(error.message || "Sohbet yüklenemedi.");
        }
      } finally {
        if (isMounted) {
          setThreadLoading(false);
        }
      }
    };

    loadThread();

    return () => {
      isMounted = false;
    };
  }, [selectedId, user?.token, apiBaseUrl]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMessages]);

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!compose.clubId || !compose.subject.trim() || !compose.initialMessage.trim()) {
      setThreadError("Kulüp, konu ve ilk mesaj alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    setThreadError("");

    try {
      const created = await createMessageThread(compose, user.token, apiBaseUrl);
      setCompose({ clubId: "", subject: "", initialMessage: "" });
      await threadsQuery.reload();
      setSelectedId(created.id);
    } catch (error) {
      setThreadError(error.message || "Yeni sohbet başlatılamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) {
      return;
    }

    setSubmitting(true);
    setThreadError("");

    try {
      const updated = await sendThreadMessage(selectedId, { body: reply }, user.token, apiBaseUrl);
      setReply("");
      setSelectedThread(updated);
      await threadsQuery.reload();
    } catch (error) {
      setThreadError(error.message || "Mesaj gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (threadsQuery.loading || clubsQuery.loading) {
    return <div className="loading-state loading-state-large">Mesajlar hazırlanıyor...</div>;
  }

  if (threadsQuery.error || clubsQuery.error) {
    return <div className="error-panel">{threadsQuery.error || clubsQuery.error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Mesajlaşma</p>
          <h1>Kulüplerle doğrudan ve düzenli iletişim kurun.</h1>
          <p>Gelen kutusu, sohbet listesi ve aktif konuşma alanı aynı deneyimde bir arada.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <span>Toplam okunmamış mesaj</span>
          <strong>{totalUnreadCount}</strong>
          <small>Bir konuşmayı açtığınızda o konuya ait okunmamış sayı otomatik olarak düşürülür.</small>
        </div>
      </section>

      {threadError ? <div className="error-panel">{threadError}</div> : null}

      <div className="messaging-layout">
        <SectionCard title="Sohbet listesi" description="Güncel konuşmaları buradan takip edin.">
          <div className="stack-list">
            {threads.length ? (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`thread-list-item ${selectedId === thread.id ? "active" : ""}`}
                  onClick={() => setSelectedId(thread.id)}
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
              <EmptyState title="Henüz sohbet yok." description="Yeni mesaj başlattığınızda sohbetler burada listelenecek." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Aktif konuşma" description="Kulüp yöneticileri ve öğrenciler için pratik sohbet alanı.">
          {threadLoading ? (
            <div className="loading-state">Konuşma yükleniyor...</div>
          ) : selectedThread ? (
            <div className="conversation-shell">
              <div className="conversation-header">
                <strong>{selectedThread.subject}</strong>
                <span>{selectedThread.clubName}</span>
              </div>
              <div className="conversation-messages">
                {selectedMessages.length ? (
                  selectedMessages.map((message) => (
                    <div key={message.id} className={`message-bubble ${message.senderUserId === user.id ? "is-own" : ""}`}>
                      <strong>{message.senderName}</strong>
                      <span>{message.body}</span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Bu sohbette mesaj yok." description="Aşağıdaki alanla ilk mesajı gönderebilirsiniz." />
                )}
                <div ref={messagesEndRef} />
              </div>
              <form className="conversation-reply" onSubmit={handleReply}>
                <textarea
                  rows="3"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Mesajınızı yazın"
                />
                <button className="primary-button" type="submit" disabled={submitting || !reply.trim()}>
                  {submitting ? "Gönderiliyor..." : "Gönder"}
                </button>
              </form>
            </div>
          ) : (
            <EmptyState title="Bir sohbet seçin." description="Soldaki listedeki konuşmalardan birini açabilir veya yeni sohbet başlatabilirsiniz." />
          )}
        </SectionCard>
      </div>

      {user.role === "Student" ? (
        <SectionCard title="Kulübe mesaj gönder" description="Öğrenciler bir kulüple doğrudan yeni sohbet başlatabilir.">
          <form className="management-form" onSubmit={handleCreateThread}>
            <div className="form-grid two-column">
              <label>
                Kulüp
                <select value={compose.clubId} onChange={(event) => setCompose({ ...compose, clubId: event.target.value })}>
                  <option value="">Kulüp seçin</option>
                  {uniqueClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Konu
                <input value={compose.subject} onChange={(event) => setCompose({ ...compose, subject: event.target.value })} />
              </label>
            </div>
            <label>
              İlk mesaj
              <textarea
                rows="4"
                value={compose.initialMessage}
                onChange={(event) => setCompose({ ...compose, initialMessage: event.target.value })}
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Gönderiliyor..." : "Sohbet Başlat"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}
