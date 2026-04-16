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
  fetchMyStats,
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
  const myStats = useAsyncData(() => fetchMyStats(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);
  const myEvents = useAsyncData(() => fetchMyEvents(user.token, apiBaseUrl), [apiBaseUrl, user?.token]);

  if ([dashboard, clubs, events, rooms, students, myStats, myEvents].some((query) => query.loading)) {
    return <div className="loading-state loading-state-large">İstatistikler hazırlanıyor...</div>;
  }

  if ([dashboard, clubs, events, rooms, students, myStats, myEvents].some((query) => query.error)) {
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
            <h1>Etkinlik geçmişiniz artık daha anlamlı okunuyor.</h1>
            <p>
              Kayıtlarınız, katılım geçmişiniz ve yaklaşan planlarınız tek bir kişisel panel içinde daha net bir öncelik
              sırasıyla sunulur.
            </p>
          </div>
          <div className="hero-metrics hero-metrics-compact">
            <StatCard title="Kayıtlı etkinlik" value={myStats.data.registeredEventCount} accent="teal" subtitle="Toplam kayıt" />
            <StatCard title="Katıldığım etkinlik" value={myStats.data.attendedEventCount} accent="blue" subtitle="Fiili katılım" />
            <StatCard title="Yaklaşan plan" value={myStats.data.upcomingEventCount} accent="orange" subtitle="Ajandadaki etkinlikler" />
            <StatCard
              title="Verdiğim puan ortalaması"
              value={myStats.data.reviewCount ? myStats.data.averageRatingGiven.toFixed(1) : "Yok"}
              accent="rose"
              subtitle={`${myStats.data.reviewCount} değerlendirme`}
            />
          </div>
        </section>

        <div className="two-column">
          <SectionCard title="Yaklaşan etkinlik planım" description="Kısa vadede sizi bekleyen kayıtlı etkinlikler.">
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
                <EmptyState title="Yaklaşan kayıt bulunmuyor." description="Yeni etkinliklere kayıt olduğunuzda planınız burada görünür." />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Katılım geçmişim" description="Tamamlanmış etkinlikler içindeki görünür hareketleriniz.">
            <div className="stack-list">
              {attendedEvents.length ? (
                attendedEvents.map((item) => (
                  <div key={item.id} className="list-row">
                    <strong>{item.title}</strong>
                    <span>{new Date(item.startDate).toLocaleDateString("tr-TR")} • Katıldınız</span>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Henüz işlenmiş katılım yok."
                  description="Etkinlikler tamamlandıkça ve katılım işlendiğinde bu alan dolacaktır."
                />
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Kişisel özet" description="Gerçek verinizle beslenen, daha dolu ve daha düzenli bir kişisel görünüm.">
          <div className="insight-grid">
            <div className="insight-card">
              <strong>Etkinlik ritmi</strong>
              <span>{registeredEvents.length} kayıt, {attendedEvents.length} fiili katılım ile aktif bir kullanım akışı görünür.</span>
            </div>
            <div className="insight-card">
              <strong>Gelecek planı</strong>
              <span>
                {upcomingEvents.length
                  ? `${upcomingEvents.length} yaklaşan plan ajandanızda yer alıyor.`
                  : "Takviminizi genişletmek için yeni etkinliklere kayıt olabilirsiniz."}
              </span>
            </div>
            <div className="insight-card">
              <strong>Geri bildirim katkısı</strong>
              <span>
                {myStats.data.reviewCount
                  ? `${myStats.data.reviewCount} etkinlik için puan verildi.`
                  : "Henüz değerlendirme bırakılmamış."}
              </span>
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
          <p className="eyebrow">Yönetim İstatistikleri</p>
          <h1>Daha güçlü, daha okunur bir karar panosu.</h1>
          <p>
            İstatistik ekranı artık yalnızca sayılar göstermiyor; kulüp hareketini, katılım kalitesini, salon
            yoğunluğunu ve öğrenci dağılımını anlamayı kolaylaştıran bir sunum yüzeyi sunuyor.
          </p>
        </div>
        <div className="hero-metrics">
          <StatCard title="Toplam öğrenci" value={dashboard.data.totalStudents} accent="teal" subtitle="Sistemde kayıtlı öğrenci" />
          <StatCard title="Toplam kayıt" value={dashboard.data.totalRegistrations} accent="blue" subtitle="Etkinlik başvuruları" />
          <StatCard title="Toplam katılım" value={dashboard.data.totalAttendance} accent="orange" subtitle="İşlenmiş yoklama" />
          <StatCard
            title="Ortalama puan"
            value={dashboard.data.averageRating ? dashboard.data.averageRating.toFixed(1) : "Yok"}
            accent="rose"
            subtitle="Katılımcı değerlendirmeleri"
          />
        </div>
      </section>

      <SectionCard title="Öne çıkan yönetim sinyalleri" description="Sunum anlatımını güçlendiren kısa yorumlar ve mevcut verinin en anlamlı yüzleri.">
        <div className="insight-grid">
          <div className="insight-card">
            <strong>En üretken kulüp</strong>
            <span>{topClub ? `${topClub.clubName}, ${topClub.eventCount} etkinlikle öne çıkıyor.` : "Henüz kulüp verisi yok."}</span>
          </div>
          <div className="insight-card">
            <strong>En yoğun salon</strong>
            <span>{topRoom ? `${topRoom.roomName}, ${topRoom.eventCount} kullanım ile planlama yükünü taşıyor.` : "Henüz salon verisi yok."}</span>
          </div>
          <div className="insight-card">
            <strong>En yüksek doluluk</strong>
            <span>
              {strongestEvent
                ? `${strongestEvent.title}, %${Math.round(strongestEvent.fillRate)} doluluk oranına ulaştı.`
                : "Henüz etkinlik performans verisi yok."}
            </span>
          </div>
        </div>
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Kulüp bazlı etkinlik üretimi" description="Kulüplerin ne kadar aktif içerik ürettiğini yatay karşılaştırma ile görün." className="chart-panel">
          <Bars data={clubs.data} xKey="clubName" dataKey="eventCount" />
        </SectionCard>
        <SectionCard title="Fakülte dağılımı" description="Katılımcı havuzunun hangi akademik kümelerde yoğunlaştığını izleyin." className="chart-panel">
          <PieBreakdown data={toPieData(students.data?.facultyDistribution)} nameKey="name" dataKey="value" />
        </SectionCard>
      </div>

      <div className="two-column">
        <SectionCard title="Etkinlik doluluk oranları" description="İlgi çeken etkinlikleri ve kapasite kullanımını kıyaslayın." className="chart-panel">
          <Bars data={events.data} xKey="title" dataKey="fillRate" />
        </SectionCard>
        <SectionCard title="Salon kullanım yoğunluğu" description="Hangi alanların planlama açısından daha kritik hale geldiğini görün." className="chart-panel">
          <Bars data={rooms.data} xKey="roomName" dataKey="eventCount" />
        </SectionCard>
      </div>

      <div className="two-column">
        <SectionCard title="Kulüp görünümü" description="Üretim ve aktif üye sayısını birlikte değerlendirin.">
          <div className="stack-list">
            {clubs.data.map((item) => (
              <div key={item.clubId} className="list-row list-row-split">
                <div>
                  <strong>{item.clubName}</strong>
                  <span>{item.presidentName}</span>
                </div>
                <div className="list-row-side">
                  <strong>{item.eventCount} etkinlik</strong>
                  <span>{item.activeMemberCount} aktif üye</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Etkinlik görünümü" description="Katılım, maliyet ve değerlendirme dengesini tek listede izleyin.">
          <div className="stack-list">
            {events.data.slice(0, 6).map((item) => (
              <div key={item.eventId} className="list-row">
                <strong>{item.title}</strong>
                <span>
                  %{Math.round(item.fillRate)} doluluk • {item.actualAttendanceCount} katılım • Ortalama{" "}
                  {item.averageRating ? item.averageRating.toFixed(1) : "0.0"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
