import { Link } from "react-router-dom";
import { Bars } from "../components/Charts";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchRoomAvailability, fetchRoomPopularity, fetchRooms } from "../services/resourceService";

function getStatusTone(statusLabel) {
  if (statusLabel === "Boş") return "tone-teal";
  if (statusLabel === "Dolu") return "tone-rose";
  return "tone-blue";
}

export function RoomsPage() {
  const { apiBaseUrl, user } = useAuth();
  const rooms = useAsyncData(() => fetchRooms(apiBaseUrl), [apiBaseUrl]);
  const availability = useAsyncData(() => fetchRoomAvailability(apiBaseUrl), [apiBaseUrl]);
  const popularity = useAsyncData(() => fetchRoomPopularity(apiBaseUrl), [apiBaseUrl]);

  if (rooms.loading || availability.loading || popularity.loading) {
    return <div className="loading-state loading-state-large">Salon verileri hazırlanıyor...</div>;
  }

  if (rooms.error || availability.error || popularity.error) {
    return <div className="error-panel">{rooms.error || availability.error || popularity.error}</div>;
  }

  const availableCount = availability.data.filter((item) => item.statusLabel === "Boş").length;
  const busyCount = availability.data.filter((item) => item.statusLabel === "Dolu").length;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Salonlar</p>
          <h1>Salon yönetimini daha anlaşılır görün.</h1>
          <p>
            Envanter, uygunluk ve kullanım yoğunluğu artık aynı sayfada daha güçlü bir görsel hiyerarşi ile sunuluyor.
          </p>
        </div>
        <div className="hero-actions">
          {user?.role === "Admin" ? (
            <Link className="primary-button link-button" to="/rooms/new">
              Yeni salon ekle
            </Link>
          ) : null}
          <div className="status-panel">
            <strong>{rooms.data.length} salon</strong>
            <span>Boş ve dolu alanları hızlıca ayırt etmek için sade ama güçlü bir görünüm sunulur.</span>
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard title="Toplam salon" value={rooms.data.length} accent="teal" subtitle="Sistemde tanımlı alanlar" />
        <StatCard title="Şu an boş" value={availableCount} accent="blue" subtitle="Planlamaya hazır alanlar" />
        <StatCard title="Şu an dolu" value={busyCount} accent="orange" subtitle="Kullanımda olan alanlar" />
        <StatCard title="Yoğunluk verisi" value={popularity.data.length} accent="rose" subtitle="Kullanım analizi olan salonlar" />
      </div>

      <div className="two-column">
        <SectionCard title="Salon uygunluğu" description="Anlık durum, sonraki plan ve bina bilgisi aynı satırda gösterilir.">
          <div className="stack-list">
            {availability.data.length ? (
              availability.data.map((room) => (
                <div key={room.roomId} className="list-row room-row">
                  <div>
                    <strong>{room.roomName}</strong>
                    <span>{room.building}</span>
                  </div>
                  <div className="room-status-box">
                    <span className={`pill ${getStatusTone(room.statusLabel)}`}>{room.statusLabel}</span>
                    <small>
                      {room.nextOccupiedStartDate
                        ? `${room.nextEventTitle || "Planlı etkinlik"} • ${new Date(room.nextOccupiedStartDate).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}`
                        : "Yakın takvim boş"}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Salon uygunluk verisi bulunamadı." description="Takvim verisi geldikçe bu alan otomatik olarak dolacaktır." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Salon kullanım yoğunluğu" description="Hangi salonların daha fazla planlandığını görsel olarak izleyin.">
          {popularity.data.length ? (
            <Bars data={popularity.data} xKey="roomName" dataKey="eventCount" />
          ) : (
            <EmptyState title="Yoğunluk grafiği için veri yok." description="Etkinlik kayıtları arttığında grafik burada görünür." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Salon envanteri" description="Kapasite, tür ve güncel durum bilgilerini sade kart düzeninde inceleyin.">
        {rooms.data.length ? (
          <div className="event-grid">
            {rooms.data
              .sort((left, right) => Number(right.isAvailable) - Number(left.isAvailable))
              .map((room) => {
                const availabilityItem = availability.data.find((item) => item.roomId === room.id);

                return (
                  <article key={room.id} className="event-card room-card">
                    <div className="badge-row">
                      <span className="pill tone-dark">{room.type}</span>
                      <span className={`pill ${availabilityItem ? getStatusTone(availabilityItem.statusLabel) : "tone-blue"}`}>
                        {availabilityItem?.statusLabel || "Durum yok"}
                      </span>
                    </div>
                    <h3>{room.name}</h3>
                    <p>{room.building}</p>
                    <p>{room.description}</p>
                    <div className="event-info-grid">
                      <div>
                        <span>Kapasite</span>
                        <strong>{room.capacity}</strong>
                      </div>
                      <div>
                        <span>Durum</span>
                        <strong>{availabilityItem?.statusLabel || (room.isAvailable ? "Boş" : "Dolu")}</strong>
                      </div>
                    </div>
                    {user?.role === "Admin" ? (
                      <div className="card-actions">
                        <Link className="ghost-button link-button" to={`/rooms/${room.id}/edit`}>
                          Düzenle
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })}
          </div>
        ) : (
          <EmptyState title="Henüz salon tanımı bulunmuyor." description="Yeni salon eklendiğinde envanter burada listelenecek." />
        )}
      </SectionCard>
    </div>
  );
}
