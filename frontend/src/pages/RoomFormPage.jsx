import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { createRoom, fetchRoomById, updateRoom } from "../services/resourceService";

const emptyForm = {
  name: "",
  building: "",
  type: "",
  description: "",
  capacity: 50,
  isAvailable: true
};

export function RoomFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiBaseUrl, user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    const load = async () => {
      try {
        const data = await fetchRoomById(id, apiBaseUrl);
        setForm({
          name: data.name || "",
          building: data.building || "",
          type: data.type || "",
          description: data.description || "",
          capacity: data.capacity || 50,
          isAvailable: Boolean(data.isAvailable)
        });
      } catch (err) {
        setError(err.message || "Salon verisi yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiBaseUrl, id, mode]);

  const title = useMemo(() => (mode === "edit" ? "Salon Düzenle" : "Yeni Salon Oluştur"), [mode]);

  const validate = () => {
    if (!form.name.trim()) return "Salon adı zorunludur.";
    if (!form.building.trim()) return "Bina adı zorunludur.";
    if (!form.type.trim()) return "Salon tipi zorunludur.";
    if (!form.description.trim()) return "Salon açıklaması zorunludur.";
    if (Number(form.capacity) <= 0) return "Kapasite sıfırdan büyük olmalıdır.";
    return "";
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
      const payload = {
        name: form.name.trim(),
        building: form.building.trim(),
        type: form.type.trim(),
        description: form.description.trim(),
        capacity: Number(form.capacity),
        isAvailable: form.isAvailable
      };

      await (mode === "edit"
        ? updateRoom(id, payload, user.token, apiBaseUrl)
        : createRoom(payload, user.token, apiBaseUrl));

      setSuccess(mode === "edit" ? "Salon güncellendi." : "Salon oluşturuldu.");
      setTimeout(() => navigate("/rooms"), 700);
    } catch (err) {
      setError(err.message || "İşlem başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Salon formu yükleniyor...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Admin Yönetimi</p>
          <h1>{title}</h1>
          <p>Salon envanterini, kapasiteyi ve kullanılabilirlik bilgisini güncel tutun.</p>
        </div>
      </section>

      <SectionCard title={title} action={<Link to="/rooms" className="ghost-button link-button">Salonlara Dön</Link>}>
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-grid two-column">
            <label>
              Salon Adı
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Bina
              <input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            </label>
          </div>

          <div className="form-grid two-column">
            <label>
              Tip
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </label>
            <label>
              Kapasite
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </label>
          </div>

          <label>
            Açıklama
            <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            Salon kullanıma açık
          </label>

          {error ? <div className="error-panel">{error}</div> : null}
          {success ? <div className="notice-box">{success}</div> : null}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Kaydediliyor..." : mode === "edit" ? "Salonu Güncelle" : "Salon Oluştur"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
