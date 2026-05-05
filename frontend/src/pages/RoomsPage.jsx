import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchRoomAvailability, fetchRoomDayAvailability, fetchRooms } from "../services/resourceService";

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSlotLabel(slot) {
  return `${slot.startTime} - ${slot.endTime}`;
}

function getSummaryTone(label = "") {
  const normalized = String(label).toLocaleLowerCase("tr-TR");
  if (normalized.includes("tamamen boş")) return "tone-teal";
  if (normalized.includes("kısmi")) return "tone-gold";
  if (normalized.includes("rezervasyon")) return "tone-dark";
  return "tone-blue";
}

function normalizeRooms(data) {
  return Array.isArray(data)
    ? data.filter((room) => room && typeof room.id === "number" && room.name)
    : [];
}

function normalizeAvailability(data) {
  return Array.isArray(data)
    ? data.filter((item) => item && typeof item.roomId === "number")
    : [];
}

function normalizeSlots(data) {
  return Array.isArray(data?.slots) ? data.slots.filter((slot) => slot?.startTime && slot?.endTime) : [];
}

export function RoomsPage() {
  const { apiBaseUrl, user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const roomsQuery = useAsyncData(() => fetchRooms(apiBaseUrl), [apiBaseUrl]);
  const availabilityQuery = useAsyncData(() => fetchRoomAvailability(apiBaseUrl), [apiBaseUrl]);
  const dayAvailabilityQuery = useAsyncData(
    () => (selectedRoomId ? fetchRoomDayAvailability(selectedRoomId, selectedDate, apiBaseUrl) : Promise.resolve(null)),
    [selectedRoomId, selectedDate, apiBaseUrl]
  );

  const rooms = useMemo(() => normalizeRooms(roomsQuery.data), [roomsQuery.data]);
  const availability = useMemo(() => normalizeAvailability(availabilityQuery.data), [availabilityQuery.data]);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const slotList = useMemo(() => normalizeSlots(dayAvailabilityQuery.data), [dayAvailabilityQuery.data]);
  const selectedRoomAvailability = dayAvailabilityQuery.data && typeof dayAvailabilityQuery.data === "object"
    ? dayAvailabilityQuery.data
    : null;
  useEffect(() => {
    if (!rooms.length) {
      setSelectedRoomId(null);
      return;
    }

    setSelectedRoomId((current) => (current && rooms.some((room) => room.id === current) ? current : rooms[0].id));
  }, [rooms]);

  const availabilityMap = useMemo(
    () =>
      Object.fromEntries(
        availability.map((item) => [
          item.roomId,
          {
            label: item.statusLabel || "Bugün özet yok",
            nextEventTitle: item.nextEventTitle,
            nextOccupiedStartDate: item.nextOccupiedStartDate
          }
        ])
      ),
    [availability]
  );

  if (roomsQuery.loading || availabilityQuery.loading) {
    return <div className="loading-state loading-state-large">Salon görünümü hazırlanıyor...</div>;
  }

  if (roomsQuery.error || availabilityQuery.error) {
    return (
      <ErrorState
        title="Salonlar yüklenemedi"
        description="Salon listesi ve uygunluk bilgileri şu anda alınamıyor."
        error={roomsQuery.error || availabilityQuery.error}
        onRetry={() => Promise.all([roomsQuery.reload(), availabilityQuery.reload()])}
        icon="Sl"
      />
    );
  }

  return (
    <div className="page-stack">
      {user?.role === "Admin" ? (
        <div className="page-actions-row">
          <Link className="primary-button link-button" to="/rooms/new">
            Yeni Salon
          </Link>
        </div>
      ) : null}

      <SectionCard title="Salonlar">
        {rooms.length ? (
          <div className="room-card-grid">
            {rooms.map((room) => {
              const roomStatus = availabilityMap[room.id];

              return (
                <button
                  key={room.id}
                  type="button"
                  className={`room-summary-card ${selectedRoomId === room.id ? "is-active" : ""}`}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <div className="room-summary-head">
                    <div>
                      <strong>{room.name}</strong>
                      <span>{room.building || "Kampüs alanı"}</span>
                    </div>
                    <span className={`pill ${getSummaryTone(roomStatus?.label)}`}>{room.type || "Salon"}</span>
                  </div>

                  <p>{room.description || "Bu salon için kısa açıklama daha sonra güncellenecek."}</p>

                  <div className="room-summary-meta">
                    <div>
                      <span>Kapasite</span>
                      <strong>{room.capacity || 0}</strong>
                    </div>
                    <div>
                      <span>Bugün</span>
                      <strong>{roomStatus?.label || "Bugün özet yok"}</strong>
                    </div>
                  </div>

                  {roomStatus?.nextOccupiedStartDate ? (
                    <small>
                      Sıradaki rezervasyon:{" "}
                      {new Date(roomStatus.nextOccupiedStartDate).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </small>
                  ) : (
                    <small>Bugün için yeni rezervasyonlara açık görünüyor.</small>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Henüz salon tanımı bulunmuyor." description="Yeni salon eklendiğinde planlama kartları burada görünür." />
        )}
      </SectionCard>

      <SectionCard title="Uygunluk Paneli">
        {selectedRoom ? (
          <div className="room-availability-panel">
            <div className="room-availability-top">
              <div>
                <strong>{selectedRoom.name}</strong>
                <span>{selectedRoom.building || "Kampüs"} • {selectedRoom.type || "Salon"}</span>
              </div>
              <label className="availability-date-picker">
                Gün seçin
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </label>
            </div>

            {dayAvailabilityQuery.loading ? (
              <div className="loading-state">Saat blokları hazırlanıyor...</div>
            ) : dayAvailabilityQuery.error ? (
              <div className="notice-box">
                Seçili gün için salon programı yüklenemedi. Başka bir tarih seçebilir veya biraz sonra tekrar deneyebilirsiniz.
              </div>
            ) : slotList.length ? (
              <>
                <div className="room-slot-grid">
                  {slotList.map((slot) => (
                    <div key={`${slot.startTime}-${slot.endTime}`} className={`room-slot ${slot.isAvailable ? "is-free" : "is-busy"}`}>
                      <strong>{formatSlotLabel(slot)}</strong>
                      <span>{slot.label || (slot.isAvailable ? "Uygun" : "Dolu")}</span>
                    </div>
                  ))}
                </div>

                {selectedRoomAvailability && !selectedRoomAvailability.hasAvailability ? (
                  <div className="notice-box">Bu tarih için uygun zaman aralığı bulunmuyor.</div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Seçili tarih için saat bloğu bulunamadı."
                description="Başka bir tarih deneyebilir veya salon kartlarından farklı bir alan seçebilirsiniz."
              />
            )}
          </div>
        ) : (
          <EmptyState title="Bir salon seçin." description="Yukarıdaki kartlardan birine tıkladığınızda uygunluk paneli burada açılır." />
        )}
      </SectionCard>
    </div>
  );
}
