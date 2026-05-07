import { Bars, PieBreakdown } from "../components/Charts";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import {
  fetchClubStats,
  fetchDashboard,
  fetchEventStats,
  fetchImportStatus,
  fetchMyStats,
  reseedImport,
  fetchRoomStats,
  fetchStudentStats
} from "../services/dashboardService";
import { fetchMyEvents } from "../services/resourceService";

function toPieData(record = {}) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function StatisticsPage() {
  const { apiBaseUrl, user } = useAuth();
  const isManagement = ["Admin", "ClubManager"].includes(user.role);
  const dashboard = useAsyncData(
    () => (isManagement ? fetchDashboard(user.token, apiBaseUrl) : Promise.resolve(null)),
    [apiBaseUrl, isManagement, user?.token]
  );
  const clubs = useAsyncData(
    () => (isManagement ? fetchClubStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const events = useAsyncData(
    () => (isManagement ? fetchEventStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const rooms = useAsyncData(
    () => (isManagement ? fetchRoomStats(user.token, apiBaseUrl) : Promise.resolve([])),
    [apiBaseUrl, isManagement, user?.token]
  );
  const students = useAsyncData(
    () => (isManagement ? fetchStudentStats(user.token, apiBaseUrl) : Promise.resolve(null)),
    [apiBaseUrl, isManagement, user?.token]
  );
  const importStatus = useAsyncData(
    () => (user.role === "Admin" ? fetchImportStatus(user.token, apiBaseUrl) : Promise.resolve(null)),
    [apiBaseUrl, user?.role, user?.token]
  );
  const myStats = useAsyncData(() => fetchMyStats(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);
  const myEvents = useAsyncData(() => fetchMyEvents(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);

  const handleReseed = async () => {
    if (!window.confirm("Gerçek SKS verisi yeniden yüklensin mi? Mevcut kulüp, etkinlik ve salon verileri yenilenir.")) {
      return;
    }

    await reseedImport(user.token, apiBaseUrl);
    await Promise.all([dashboard.reload(), clubs.reload(), events.reload(), rooms.reload(), students.reload(), importStatus.reload()]);
  };

  if ([dashboard, clubs, events, rooms, students, importStatus, myStats, myEvents].some((query) => query.loading)) {
    return <div className="loading-state loading-state-large">İstatistikler hazırlanıyor...</div>;
  }

  if ([dashboard, clubs, events, rooms, students, importStatus, myStats, myEvents].some((query) => query.error)) {
    return <div className="error-panel">İstatistik verileri alınamadı.</div>;
  }

  if (!isManagement) {
    const attendedEvents = myEvents.data?.attendedEvents || [];
    const upcomingEvents = myEvents.data?.upcomingRegistrations || [];
    const registeredEvents = myEvents.data?.registeredEvents || [];

    return (
      <div className="page-stack">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Kişisel İstatistikler</p>
            <h1>Kişisel etkinlik özeti</h1>
            <p>Kayıtlarınız, katılımınız ve puanlarınız burada.</p>
          </div>
          <div className="hero-metrics hero-metrics-compact">
            <StatCard title="Kayıtlı Etkinlik" value={myStats.data.registeredEventCount} accent="teal" subtitle="Toplam kayıt" />
            <StatCard title="Katıldığım" value={myStats.data.attendedEventCount} accent="blue" subtitle="Fiili katılım" />
            <StatCard title="Yaklaşan Plan" value={myStats.data.upcomingEventCount} accent="orange" subtitle="Ajandadaki etkinlikler" />
            <StatCard
              title="Verdiğim Puan"
              value={myStats.data.reviewCount ? myStats.data.averageRatingGiven.toFixed(1) : "Yok"}
              accent="rose"
              subtitle={`${myStats.data.reviewCount} değerlendirme`}
            />
          </div>
        </section>

        <div className="two-column">
          <SectionCard title="Yaklaşan Planım" description="Kayıtlı etkinlikler.">
            <div className="stack-list">
              {upcomingEvents.length ? (
                upcomingEvents.map((item) => (
                  <div key={item.id} className="list-row">
                    <strong>{item.title}</strong>
                    <span>
                      {new Date(item.startDate).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState title="Yaklaşan kayıt yok." description="Yeni etkinlikler burada görünür." icon="Tk" />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Katılım Geçmişim" description="Tamamlanan etkinlikler.">
            <div className="stack-list">
              {attendedEvents.length ? (
                attendedEvents.map((item) => (
                  <div key={item.id} className="list-row">
                    <strong>{item.title}</strong>
                    <span>{new Date(item.startDate).toLocaleDateString("tr-TR")} • Katıldınız</span>
                  </div>
                ))
              ) : (
                <EmptyState title="Henüz katılım yok." description="İşlenmiş katılımlar burada görünür." icon="Kt" />
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Kişisel Özet" description="Kısa görünüm.">
          <div className="insight-grid">
            <div className="insight-card">
              <strong>Etkinlik Ritmi</strong>
              <span>{registeredEvents.length} kayıt, {attendedEvents.length} katılım.</span>
            </div>
            <div className="insight-card">
              <strong>Gelecek Planı</strong>
              <span>{upcomingEvents.length ? `${upcomingEvents.length} etkinlik ajandanızda.` : "Takvim şu an boş."}</span>
            </div>
            <div className="insight-card">
              <strong>Geri Bildirim</strong>
              <span>{myStats.data.reviewCount ? `${myStats.data.reviewCount} yorum bıraktınız.` : "Henüz yorum yok."}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  const topClub = clubs.data?.[0];
  const topRoom = rooms.data?.[0];
  const strongestEvent = [...(events.data || [])].sort((left, right) => right.fillRate - left.fillRate)[0];

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">İstatistikler</p>
          <h1>Karar özeti</h1>
          <p>Kulüpler, katılım ve salon yoğunluğu tek görünümde.</p>
        </div>
        <div className="hero-metrics">
          <StatCard title="Toplam Öğrenci" value={dashboard.data.totalStudents} accent="teal" subtitle="Kayıtlı kullanıcı" />
          <StatCard title="Toplam Kayıt" value={dashboard.data.totalRegistrations} accent="blue" subtitle="Etkinlik başvurusu" />
          <StatCard title="Toplam Katılım" value={dashboard.data.totalAttendance} accent="orange" subtitle="İşlenmiş yoklama" />
          <StatCard
            title="Ortalama Puan"
            value={dashboard.data.averageRating ? dashboard.data.averageRating.toFixed(1) : "Yok"}
            accent="rose"
            subtitle="Genel değerlendirme"
          />
        </div>
      </section>

      {user.role === "Admin" && importStatus.data ? (
        <SectionCard
          title="Veri Aktarım Durumu"
          description="Gerçek SKS kaynaklarından üretilen veri özeti."
          action={<button className="ghost-button" type="button" onClick={handleReseed}>Yeniden Yükle</button>}
        >
          <div className="insight-grid">
            <div className="insight-card"><strong>{importStatus.data.totalClubs}</strong><span>Kulüp</span></div>
            <div className="insight-card"><strong>{importStatus.data.totalEvents}</strong><span>Etkinlik</span></div>
            <div className="insight-card"><strong>{importStatus.data.totalRooms}</strong><span>Salon</span></div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Öne Çıkan Sinyaller" description="En görünür veriler.">
        <div className="insight-grid">
          <div className="insight-card">
            <strong>En Aktif Kulüp</strong>
            <span>{topClub ? `${topClub.clubName}, ${topClub.eventCount} etkinlik.` : "Veri yok."}</span>
          </div>
          <div className="insight-card">
            <strong>En Yoğun Salon</strong>
            <span>{topRoom ? `${topRoom.roomName}, ${topRoom.eventCount} kullanım.` : "Veri yok."}</span>
          </div>
          <div className="insight-card">
            <strong>En Yüksek Doluluk</strong>
            <span>{strongestEvent ? `${strongestEvent.title}, %${Math.round(strongestEvent.fillRate)}.` : "Veri yok."}</span>
          </div>
        </div>
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Kulüp Durumu" description="Etkinlik üretimi." className="chart-panel">
          <Bars data={clubs.data} xKey="clubName" dataKey="eventCount" />
        </SectionCard>
        <SectionCard title="Fakülte Dağılımı" description="Katılımcı görünümü." className="chart-panel">
          <PieBreakdown data={toPieData(students.data?.facultyDistribution)} nameKey="name" dataKey="value" />
        </SectionCard>
      </div>

      <div className="two-column">
        <SectionCard title="Etkinlik Özeti" description="Doluluk oranları." className="chart-panel">
          <Bars data={events.data} xKey="title" dataKey="fillRate" />
        </SectionCard>
        <SectionCard title="Salon Yoğunluğu" description="Planlama baskısı." className="chart-panel">
          <Bars data={rooms.data} xKey="roomName" dataKey="eventCount" />
        </SectionCard>
      </div>

      <div className="two-column">
        <SectionCard title="Kulüpler" description="Üretim ve takip sinyalleri.">
          <div className="stack-list">
            {clubs.data.map((item) => (
              <div key={item.clubId} className="list-row list-row-split">
                <div>
                  <strong>{item.clubName}</strong>
                  <span>{item.presidentName}</span>
                </div>
                <div className="list-row-side">
                  <strong>{item.eventCount} etkinlik</strong>
                  <span>{item.activeMemberCount} takip sinyali</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Etkinlikler" description="Katılım ve puan dengesi.">
          <div className="stack-list">
            {events.data.slice(0, 6).length ? (
              events.data.slice(0, 6).map((item) => (
                <div key={item.eventId} className="list-row">
                  <strong>{item.title}</strong>
                  <span>%{Math.round(item.fillRate)} doluluk • {item.actualAttendanceCount} katılım • {item.averageRating ? item.averageRating.toFixed(1) : "0.0"} puan</span>
                </div>
              ))
            ) : (
              <EmptyState title="Etkinlik verisi yok." description="Yeni etkinlikler burada görünür." icon="Et" />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
