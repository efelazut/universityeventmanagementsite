import { Link } from "react-router-dom";
import { Bars } from "../components/Charts";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchClubStats, fetchDashboard, fetchEventStats, fetchMyStats, fetchRoomStats } from "../services/dashboardService";
import { fetchMyEvents, fetchUpcomingEvents } from "../services/resourceService";

function getRoleTitle(role) {
  if (role === "Admin") return "Yönetim Paneli";
  if (role === "ClubManager") return "Kulüp Paneli";
  return "Panel";
}

export function DashboardPage() {
  const { user, apiBaseUrl } = useAuth();
  const isManagement = ["Admin", "ClubManager"].includes(user.role);
  const dashboard = useAsyncData(
    () => (isManagement ? fetchDashboard(user.token, apiBaseUrl) : Promise.resolve(null)),
    [apiBaseUrl, isManagement, user?.token]
  );
  const clubStats = useAsyncData(
    () => (isManagement ? fetchClubStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const eventStats = useAsyncData(
    () => (isManagement ? fetchEventStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const roomStats = useAsyncData(
    () => (isManagement ? fetchRoomStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const myStats = useAsyncData(() => fetchMyStats(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);
  const myEvents = useAsyncData(() => fetchMyEvents(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);
  const upcoming = useAsyncData(() => fetchUpcomingEvents(apiBaseUrl), [apiBaseUrl]);

  if ([dashboard, clubStats, eventStats, roomStats, myStats, myEvents, upcoming].some((query) => query.loading)) {
    return <div className="loading-state loading-state-large">Panel hazırlanıyor...</div>;
  }

  if ([dashboard, clubStats, eventStats, roomStats, myStats, myEvents, upcoming].some((query) => query.error)) {
    return <div className="error-panel">Panel verileri alınamadı.</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{getRoleTitle(user.role)}</p>
          <h1>{user.fullName} için özet görünüm</h1>
          <p>Önemli sayılar, planlar ve karar sinyalleri burada.</p>
        </div>
        <div className="status-panel status-panel-wide">
          <strong>Bugün</strong>
          <span>{isManagement ? "Operasyon ve doluluk" : "Kayıtlar ve yaklaşan planlar"}</span>
        </div>
      </section>

      {isManagement ? (
        <>
          <SectionCard
            title="Kısayollar"
            description="Sık kullanılan işlemler."
            action={
              <div className="inline-actions">
                {user.role === "Admin" ? <Link to="/clubs/new" className="ghost-button link-button">Kulüp Oluştur</Link> : null}
                {user.role === "Admin" ? <Link to="/rooms/new" className="ghost-button link-button">Salon Ekle</Link> : null}
                <Link to="/events/new" className="primary-button link-button">Etkinlik Oluştur</Link>
              </div>
            }
          >
            <div className="insight-grid">
              <div className="insight-card">
                <strong>Kulüpler</strong>
                <span>Yapıyı güncelleyin ve ekipleri yönetin.</span>
              </div>
              <div className="insight-card">
                <strong>Etkinlikler</strong>
                <span>Takvimi canlı tutun.</span>
              </div>
              <div className="insight-card">
                <strong>Salonlar</strong>
                <span>Yoğunluğu hızlıca kontrol edin.</span>
              </div>
            </div>
          </SectionCard>

          <div className="stat-grid">
            <StatCard title="Toplam Etkinlik" value={dashboard.data.eventCount} accent="teal" subtitle="Sistem genelinde" />
            <StatCard title="Yaklaşan" value={dashboard.data.upcomingEventCount} accent="blue" subtitle="Planlanan etkinlik" />
            <StatCard title="Katılım" value={dashboard.data.totalAttendance} accent="orange" subtitle="İşlenmiş yoklama" />
            <StatCard
              title="Ortalama Puan"
              value={dashboard.data.averageRating ? dashboard.data.averageRating.toFixed(1) : "Yok"}
              accent="rose"
              subtitle="Yorumlardan"
            />
          </div>

          <div className="two-column">
            <SectionCard title="Kulüp Durumu" description="Etkinlik üretimi.">
              <Bars data={clubStats.data} xKey="clubName" dataKey="eventCount" />
            </SectionCard>
            <SectionCard title="Salon Yoğunluğu" description="Kullanım baskısı.">
              <Bars data={roomStats.data} xKey="roomName" dataKey="eventCount" />
            </SectionCard>
          </div>

          <SectionCard title="Etkinlik Özeti" description="Doluluk oranları.">
            <Bars data={eventStats.data} xKey="title" dataKey="fillRate" />
          </SectionCard>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard title="Kayıtlı Etkinlik" value={myStats.data.registeredEventCount} accent="teal" subtitle="Toplam kayıt" />
            <StatCard title="Katıldığım" value={myStats.data.attendedEventCount} accent="blue" subtitle="İşlenmiş katılım" />
            <StatCard title="Yaklaşan Plan" value={myStats.data.upcomingEventCount} accent="orange" subtitle="Ajandada" />
            <StatCard
              title="Verdiğim Puan"
              value={myStats.data.reviewCount ? myStats.data.averageRatingGiven.toFixed(1) : "Yok"}
              accent="rose"
              subtitle={`${myStats.data.reviewCount} değerlendirme`}
            />
          </div>

          <div className="two-column">
            <SectionCard title="Yaklaşan Etkinlikler" description="Sıradaki planlar.">
              <div className="stack-list">
                {upcoming.data.slice(0, 5).length ? (
                  upcoming.data.slice(0, 5).map((item) => (
                    <Link key={item.id} className="list-row" to={`/events/${item.id}`}>
                      <strong>{item.title}</strong>
                      <span>
                        {new Date(item.startDate).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState title="Yaklaşan etkinlik yok." description="Yeni planlar burada görünür." icon="Tk" />
                )}
              </div>
            </SectionCard>
            <SectionCard title="Katılım Geçmişi" description="Tamamlanan etkinlikler.">
              <div className="stack-list">
                {myEvents.data.attendedEvents.length ? (
                  myEvents.data.attendedEvents.map((item) => (
                    <Link key={item.id} className="list-row" to={`/events/${item.id}`}>
                      <strong>{item.title}</strong>
                      <span>{new Date(item.startDate).toLocaleDateString("tr-TR")} • Katıldınız</span>
                    </Link>
                  ))
                ) : (
                  <EmptyState title="Katılım geçmişi boş." description="İşlenmiş katılımlar burada görünür." icon="Kt" />
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
