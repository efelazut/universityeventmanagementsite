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
  if (role === "Admin") return "Yönetim paneli";
  if (role === "ClubManager") return "Kulüp yönetici paneli";
  return "Öğrenci paneli";
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
          <h1>{user.fullName} için daha net bir kontrol yüzeyi</h1>
          <p>
            Rolünüze göre en önemli sayı, aksiyon ve görünür planları sade ama güçlü bir düzen içinde sunuyoruz.
          </p>
        </div>
        <div className="status-panel status-panel-wide">
          <strong>Bugün için odak</strong>
          <span>
            {isManagement
              ? "Operasyon, doluluk ve salon yükünü birlikte izleyin."
              : "Kayıtlarınızı, yaklaşan etkinlikleri ve katılım geçmişinizi takip edin."}
          </span>
        </div>
      </section>

      {isManagement ? (
        <>
          <SectionCard
            title="Yönetim kısayolları"
            description="Günlük operasyon akışında en sık kullanılan giriş noktaları."
            action={
              <div className="inline-actions">
                {user.role === "Admin" ? (
                  <Link to="/clubs/new" className="ghost-button link-button">
                    Kulüp oluştur
                  </Link>
                ) : null}
                {user.role === "Admin" ? (
                  <Link to="/rooms/new" className="ghost-button link-button">
                    Salon ekle
                  </Link>
                ) : null}
                <Link to="/events/new" className="primary-button link-button">
                  Etkinlik oluştur
                </Link>
              </div>
            }
          >
            <div className="insight-grid">
              <div className="insight-card">
                <strong>Hızlı içerik üretimi</strong>
                <span>Kulüp, salon ve etkinlik işlemlerine tek karttan erişebilirsiniz.</span>
              </div>
              <div className="insight-card">
                <strong>Sunuma hazır görünüm</strong>
                <span>Öne çıkan metrikler ve grafikler karar anlatımını kolaylaştırır.</span>
              </div>
              <div className="insight-card">
                <strong>Operasyonel şeffaflık</strong>
                <span>Doluluk, puan ve salon yükü birlikte izlenebilir.</span>
              </div>
            </div>
          </SectionCard>

          <div className="stat-grid">
            <StatCard title="Toplam etkinlik" value={dashboard.data.eventCount} accent="teal" subtitle="Sistemdeki tüm etkinlikler" />
            <StatCard title="Yaklaşan etkinlik" value={dashboard.data.upcomingEventCount} accent="blue" subtitle="Planı devam edenler" />
            <StatCard title="Toplam katılım" value={dashboard.data.totalAttendance} accent="orange" subtitle="İşlenmiş yoklama" />
            <StatCard
              title="Ortalama puan"
              value={dashboard.data.averageRating ? dashboard.data.averageRating.toFixed(1) : "Yok"}
              accent="rose"
              subtitle="Katılımcı değerlendirmeleri"
            />
          </div>

          <div className="two-column">
            <SectionCard title="Kulüp etkinlik dağılımı" description="Hangi kulüpler daha aktif çalışıyor?">
              <Bars data={clubStats.data} xKey="clubName" dataKey="eventCount" />
            </SectionCard>
            <SectionCard title="Salon kullanım yoğunluğu" description="Planlama baskısı hangi alanlarda toplanıyor?">
              <Bars data={roomStats.data} xKey="roomName" dataKey="eventCount" />
            </SectionCard>
          </div>

          <SectionCard title="Etkinlik performansı" description="Doluluk oranlarıyla etkinlik ilgisini daha rahat kıyaslayın.">
            <Bars data={eventStats.data} xKey="title" dataKey="fillRate" />
          </SectionCard>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard title="Kayıtlı etkinlik" value={myStats.data.registeredEventCount} accent="teal" subtitle="Toplam kayıt" />
            <StatCard title="Katıldığım etkinlik" value={myStats.data.attendedEventCount} accent="blue" subtitle="İşlenmiş katılım" />
            <StatCard title="Yaklaşan plan" value={myStats.data.upcomingEventCount} accent="orange" subtitle="Ajandadaki etkinlikler" />
            <StatCard
              title="Puan ortalamam"
              value={myStats.data.reviewCount ? myStats.data.averageRatingGiven.toFixed(1) : "Yok"}
              accent="rose"
              subtitle={`${myStats.data.reviewCount} değerlendirme`}
            />
          </div>

          <div className="two-column">
            <SectionCard title="Yaklaşan etkinlikler" description="Önümüzdeki dönemde öne çıkan planlar.">
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
                  <EmptyState title="Yaklaşan etkinlik yok." description="Yeni planlar oluştuğunda burada görünecek." />
                )}
              </div>
            </SectionCard>
            <SectionCard title="Etkinlik geçmişim" description="Katıldığınız etkinlikler tek alanda toplanır.">
              <div className="stack-list">
                {myEvents.data.attendedEvents.length ? (
                  myEvents.data.attendedEvents.map((item) => (
                    <Link key={item.id} className="list-row" to={`/events/${item.id}`}>
                      <strong>{item.title}</strong>
                      <span>{new Date(item.startDate).toLocaleDateString("tr-TR")} • Katıldınız</span>
                    </Link>
                  ))
                ) : (
                  <EmptyState title="Katılım geçmişi henüz boş." description="İşlenmiş katılımlarınız burada görünür." />
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
