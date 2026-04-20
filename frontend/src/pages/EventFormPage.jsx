import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImageUploadField } from "../components/ImageUploadField";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { createEvent, deleteEvent, fetchClubs, fetchEventById, fetchEvents, fetchRooms, updateEvent, uploadImage } from "../services/resourceService";

const hourOptions = Array.from({ length: 28 }, (_, index) => {
  const hour = Math.floor(index / 2) + 9;
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

const createEmptyForm = () => ({
  title: "",
  description: "",
  category: "Teknoloji",
  campus: "Merkez Kampüs",
  format: "Fiziksel",
  imageUrl: "",
  locationDetails: "",
  clubId: "",
  roomId: "",
  startDateOnly: "",
  startTime: "10:00",
  endDateOnly: "",
  endTime: "12:00",
  capacity: 50,
  requiresApproval: false,
  isFree: true,
  price: 0,
  posterCost: 0,
  cateringCost: 0,
  speakerFee: 0,
  status: "Upcoming",
  actualAttendanceCount: 0
});

function splitDateTime(value) {
  if (!value) return { date: "", time: "10:00" };
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const [dateOnly, timeWithSeconds] = local.toISOString().split("T");
  return { date: dateOnly, time: timeWithSeconds.slice(0, 5) };
}

function toIso(datePart, timePart) {
  return new Date(`${datePart}T${timePart}:00`).toISOString();
}

function validateImageFile(file) {
  if (!file) return "";
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "Yalnızca JPG, PNG veya WEBP dosyaları yüklenebilir.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Görsel boyutu 5 MB sınırını aşamaz.";
  }

  return "";
}

export function EventFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiBaseUrl, user } = useAuth();
  const [form, setForm] = useState(createEmptyForm());
  const [clubs, setClubs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [clubList, roomList, eventList] = await Promise.all([fetchClubs(apiBaseUrl), fetchRooms(apiBaseUrl), fetchEvents(apiBaseUrl)]);
        setClubs(Array.isArray(clubList) ? clubList : []);
        setRooms(Array.isArray(roomList) ? roomList : []);
        setAllEvents(Array.isArray(eventList) ? eventList : []);

        if (mode === "edit") {
          const data = await fetchEventById(id, apiBaseUrl);
          const start = splitDateTime(data.startDate);
          const end = splitDateTime(data.endDate);
          setForm({
            title: data.title || "",
            description: data.description || "",
            category: data.category || "Teknoloji",
            campus: data.campus || "Merkez Kampüs",
            format: data.format || "Fiziksel",
            imageUrl: data.imageUrl || "",
            locationDetails: data.locationDetails || "",
            clubId: String(data.clubId ?? ""),
            roomId: String(data.roomId ?? ""),
            startDateOnly: start.date,
            startTime: start.time,
            endDateOnly: end.date,
            endTime: end.time,
            capacity: data.capacity || 50,
            requiresApproval: Boolean(data.requiresApproval),
            isFree: Boolean(data.isFree),
            price: data.price || 0,
            posterCost: data.posterCost || 0,
            cateringCost: data.cateringCost || 0,
            speakerFee: data.speakerFee || 0,
            status: data.status || "Upcoming",
            actualAttendanceCount: data.actualAttendanceCount || 0
          });
          setImagePreview(data.imageUrl || "");
        } else if (user?.role === "ClubManager" && user?.clubId) {
          setForm((prev) => ({ ...prev, clubId: String(user.clubId) }));
        }
      } catch (err) {
        setError(err.message || "Etkinlik formu yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiBaseUrl, id, mode, user]);

  const title = useMemo(() => (mode === "edit" ? "Etkinliği Düzenle" : "Yeni Etkinlik"), [mode]);
  const availableClubs = user?.role === "ClubManager" && user?.clubId ? clubs.filter((club) => club.id === user.clubId) : clubs;
  const startIso = form.startDateOnly && form.startTime ? toIso(form.startDateOnly, form.startTime) : null;
  const endIso = form.endDateOnly && form.endTime ? toIso(form.endDateOnly, form.endTime) : null;

  const conflict = useMemo(() => {
    if (!form.roomId || !startIso || !endIso) return null;
    return allEvents.find((event) => {
      if (mode === "edit" && event.id === Number(id)) return false;
      return String(event.roomId) === form.roomId &&
        new Date(event.startDate) < new Date(endIso) &&
        new Date(event.endDate) > new Date(startIso) &&
        event.computedStatus !== "Cancelled";
    });
  }, [allEvents, endIso, form.roomId, id, mode, startIso]);

  const validate = () => {
    if (!form.title.trim()) return "Etkinlik başlığı zorunludur.";
    if (user?.role === "Admin" && !form.clubId) return "Kulüp seçimi zorunludur.";
    if (!form.roomId) return "Salon seçimi zorunludur.";
    if (!form.startDateOnly || !form.endDateOnly) return "Başlangıç ve bitiş tarihi zorunludur.";
    if (!startIso || !endIso) return "Saat bilgileri zorunludur.";
    if (new Date(endIso) <= new Date(startIso)) return "Bitiş tarihi ve saati başlangıçtan sonra olmalıdır.";
    if (Number(form.capacity) <= 0) return "Kapasite sıfırdan büyük olmalıdır.";
    if (conflict) return `Seçili salon bu aralıkta dolu: ${conflict.title}`;
    if (imageError) return imageError;
    return "";
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validation = validateImageFile(file);
    setImageError(validation);
    if (validation) {
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : form.imageUrl);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageError("");
    setImagePreview(form.imageUrl || "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const uploadedImage = imageFile
        ? await uploadImage(imageFile, "events", user.token, apiBaseUrl)
        : null;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        campus: form.campus,
        format: form.format,
        imageUrl: uploadedImage?.publicUrl || form.imageUrl.trim(),
        locationDetails: form.locationDetails.trim(),
        clubId: user?.role === "ClubManager" ? user.clubId : Number(form.clubId),
        roomId: Number(form.roomId),
        startDate: startIso,
        endDate: endIso,
        capacity: Number(form.capacity),
        requiresApproval: form.requiresApproval,
        isFree: form.isFree,
        price: form.isFree ? 0 : Number(form.price),
        posterCost: Number(form.posterCost),
        cateringCost: Number(form.cateringCost),
        speakerFee: Number(form.speakerFee),
        status: form.status.trim(),
        actualAttendanceCount: Number(form.actualAttendanceCount)
      };

      const response = mode === "edit"
        ? await updateEvent(id, payload, user.token, apiBaseUrl)
        : await createEvent(payload, user.token, apiBaseUrl);

      setSuccess(mode === "edit" ? "Etkinlik güncellendi." : "Etkinlik oluşturuldu.");
      setTimeout(() => navigate(`/events/${response.id || id}`), 600);
    } catch (err) {
      setError(err.message || "İşlem başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Etkinlik formu yükleniyor...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Etkinlik Yönetimi</p>
          <h1>{title}</h1>
          <p>Tarih, saat, salon ve görsel ayarlarını tek ekranda yönetin.</p>
        </div>
      </section>

      <SectionCard
        title={title}
        action={
          <div className="inline-actions">
            {mode === "edit" ? (
              <button className="ghost-button destructive-button" type="button" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
                {deleting ? "Siliniyor..." : "Etkinliği Sil"}
              </button>
            ) : null}
            <Link to="/events" className="ghost-button link-button">Etkinliklere Dön</Link>
          </div>
        }
      >
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-grid two-column">
            <label>
              Başlık
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Kategori
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
          </div>

          <label>
            Açıklama
            <textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="form-grid two-column">
            <ImageUploadField
              label="Etkinlik görseli"
              hint="Kartlarda ve detay sayfasında öne çıkar."
              inputId="event-image-upload"
              previewUrl={imagePreview}
              onFileChange={handleImageChange}
              onClear={clearImage}
              error={imageError}
            />
            <div className="management-form">
              <label>
                Görsel URL
                <input
                  value={form.imageUrl}
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    if (!imageFile) setImagePreview(e.target.value);
                  }}
                  placeholder="Opsiyonel yedek bağlantı"
                />
              </label>
              <label>
                Kampüs / Konum etiketi
                <input value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="form-grid two-column">
            <label>
              Kulüp
              <select value={form.clubId} disabled={user?.role === "ClubManager"} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
                <option value="">Kulüp seçin</option>
                {availableClubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </label>
            <label>
              Salon
              <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                <option value="">Salon seçin</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name} - {room.building}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid event-time-grid">
            <label>
              Başlangıç tarihi
              <input type="date" value={form.startDateOnly} onChange={(e) => setForm({ ...form, startDateOnly: e.target.value })} />
            </label>
            <label>
              Başlangıç saati
              <select value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}>
                {hourOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              Bitiş tarihi
              <input type="date" value={form.endDateOnly} onChange={(e) => setForm({ ...form, endDateOnly: e.target.value })} />
            </label>
            <label>
              Bitiş saati
              <select value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}>
                {hourOptions.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>

          <div className="form-grid two-column">
            <label>
              Biçim
              <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                <option value="Fiziksel">Fiziksel</option>
                <option value="Online">Online</option>
              </select>
            </label>
            <label>
              Yer detayları
              <input value={form.locationDetails} onChange={(e) => setForm({ ...form, locationDetails: e.target.value })} placeholder="Salon, fuaye veya bağlantı bilgisi" />
            </label>
          </div>

          <div className="form-grid three-column">
            <label>
              Kontenjan
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.requiresApproval} onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })} />
              Başvuru onaylansın
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} />
              Ücretsiz etkinlik
            </label>
          </div>

          {!form.isFree ? (
            <label>
              Katılım ücreti
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
          ) : null}

          {conflict ? (
            <div className="error-panel">
              Seçili saat aralığında bu salon dolu. Çakışan etkinlik: <strong>{conflict.title}</strong>
            </div>
          ) : startIso && endIso && form.roomId ? (
            <div className="notice-box">Seçili aralık için görünür bir çakışma bulunmuyor.</div>
          ) : null}

          {error ? <div className="error-panel">{error}</div> : null}
          {success ? <div className="notice-box">{success}</div> : null}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Kaydediliyor..." : mode === "edit" ? "Etkinliği Güncelle" : "Etkinlik Oluştur"}
            </button>
          </div>
        </form>
      </SectionCard>

      <ConfirmDialog
        open={deleteDialogOpen}
        tone="danger"
        title="Etkinlik silinsin mi?"
        description="Bu işlem geri alınamaz. Etkinliğe bağlı kayıtlar ve yorumlar da silinir."
        confirmLabel="Etkinliği Sil"
        loading={deleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          setError("");
          try {
            await deleteEvent(id, user.token, apiBaseUrl);
            navigate("/events", { replace: true, state: { notice: "Etkinlik silindi." } });
          } catch (err) {
            setError(err.message || "Etkinlik silinemedi.");
          } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
          }
        }}
      />
    </div>
  );
}
