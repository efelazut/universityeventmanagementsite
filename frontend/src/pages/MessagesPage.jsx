import { useEffect, useMemo, useState } from "react";
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

  const threads = Array.isArray(threadsQuery.data) ? threadsQuery.data : [];
  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data : [];
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
          setThreadError(error.message || "Sohbet yuklenemedi.");
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

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!compose.clubId || !compose.subject.trim() || !compose.initialMessage.trim()) {
      setThreadError("Kulup, konu ve ilk mesaj alanlarini doldurun.");
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
      setThreadError(error.message || "Yeni sohbet baslatilamadi.");
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
      setThreadError(error.message || "Mesaj gonderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (threadsQuery.loading || clubsQuery.loading) {
    return <div className="loading-state loading-state-large">Mesajlar hazirlaniyor...</div>;
  }

  if (threadsQuery.error || clubsQuery.error) {
    return <div className="error-panel">{threadsQuery.error || clubsQuery.error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Mesajlasma</p>
          <h1>Kuluplerle dogrudan ve duzenli iletisim kurun.</h1>
          <p>Gelen kutusu, sohbet listesi ve aktif konusma alani ayni deneyimde bir arada.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <span>Toplam okunmamis mesaj</span>
          <strong>{totalUnreadCount}</strong>
          <small>Bir konusmayi actiginizda o konuya ait okunmamis sayi otomatik olarak dusurulur.</small>
        </div>
      </section>

      {threadError ? <div className="error-panel">{threadError}</div> : null}

      <div className="messaging-layout">
        <SectionCard title="Sohbet listesi" description="Guncel konusmalari buradan takip edin.">
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
                  <small>{thread.lastMessagePreview || "Henuz mesaj yok."}</small>
                </button>
              ))
            ) : (
              <EmptyState title="Henuz sohbet yok." description="Yeni mesaj baslattiginizda sohbetler burada listelenecek." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Aktif konusma" description="Kulup yoneticileri ve ogrenciler icin pratik sohbet alani.">
          {threadLoading ? (
            <div className="loading-state">Konusma yukleniyor...</div>
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
                  <EmptyState title="Bu sohbette mesaj yok." description="Asagidaki alanla ilk mesaji gonderebilirsiniz." />
                )}
              </div>
              <form className="conversation-reply" onSubmit={handleReply}>
                <textarea
                  rows="3"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Mesajinizi yazin"
                />
                <button className="primary-button" type="submit" disabled={submitting || !reply.trim()}>
                  {submitting ? "Gonderiliyor..." : "Gonder"}
                </button>
              </form>
            </div>
          ) : (
            <EmptyState title="Bir sohbet secin." description="Soldaki listedeki konusmalardan birini acabilir veya yeni sohbet baslatabilirsiniz." />
          )}
        </SectionCard>
      </div>

      {user.role === "Student" ? (
        <SectionCard title="Kulube mesaj gonder" description="Ogrenciler bir kulube dogrudan yeni sohbet baslatabilir.">
          <form className="management-form" onSubmit={handleCreateThread}>
            <div className="form-grid two-column">
              <label>
                Kulup
                <select value={compose.clubId} onChange={(event) => setCompose({ ...compose, clubId: event.target.value })}>
                  <option value="">Kulup secin</option>
                  {clubs.map((club) => (
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
              Ilk mesaj
              <textarea
                rows="4"
                value={compose.initialMessage}
                onChange={(event) => setCompose({ ...compose, initialMessage: event.target.value })}
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Gonderiliyor..." : "Sohbet Baslat"}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}
    </div>
  );
}
