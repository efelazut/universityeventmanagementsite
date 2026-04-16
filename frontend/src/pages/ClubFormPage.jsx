import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { createClub, fetchClubById, updateClub } from "../services/resourceService";

const emptyForm = {
  name: "",
  description: "",
  presidentName: "",
  presidentEmail: "",
  isActive: true
};

export function ClubFormPage({ mode }) {
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
        const data = await fetchClubById(id, apiBaseUrl);
        setForm({
          name: data.name || "",
          description: data.description || "",
          presidentName: data.presidentName || "",
          presidentEmail: data.presidentEmail || "",
          isActive: Boolean(data.isActive)
        });
      } catch (err) {
        setError(err.message || "Kulüp verisi yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiBaseUrl, id, mode]);

  const title = useMemo(() => (mode === "edit" ? "Kulüp Düzenle" : "Yeni Kulüp Oluştur"), [mode]);

  const validate = () => {
    if (!form.name.trim()) return "Kulüp adı zorunludur.";
    if (!form.presidentName.trim()) return "Başkan adı zorunludur.";
    if (!form.presidentEmail.trim()) return "Başkan e-postası zorunludur.";
    if (!/\S+@\S+\.\S+/.test(form.presidentEmail)) return "Geçerli bir başkan e-postası girin.";
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
        description: form.description.trim(),
        presidentName: form.presidentName.trim(),
        presidentEmail: form.presidentEmail.trim(),
        isActive: form.isActive
      };

      const response =
        mode === "edit"
          ? await updateClub(id, payload, user.token, apiBaseUrl)
          : await createClub(payload, user.token, apiBaseUrl);

      setSuccess(mode === "edit" ? "Kulüp başarıyla güncellendi." : "Kulüp başarıyla oluşturuldu.");
      setTimeout(() => navigate(`/clubs/${response.id || id}`), 700);
    } catch (err) {
      setError(err.message || "İşlem başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Kulüp formu yükleniyor...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Admin Yönetimi</p>
          <h1>{title}</h1>
          <p>Kulüp bilgilerini, başkan detaylarını ve aktiflik durumunu burada yönetin.</p>
        </div>
      </section>

      <SectionCard title={title} action={<Link to="/dashboard" className="ghost-button link-button">Panele Dön</Link>}>
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-grid two-column">
            <label>
              Kulüp Adı
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Başkan Adı
              <input value={form.presidentName} onChange={(e) => setForm({ ...form, presidentName: e.target.value })} />
            </label>
          </div>

          <label>
            Başkan E-postası
            <input
              type="email"
              value={form.presidentEmail}
              onChange={(e) => setForm({ ...form, presidentEmail: e.target.value })}
            />
          </label>

          <label>
            Açıklama
            <textarea
              rows="5"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Kulüp aktif olarak görünsün
          </label>

          {error ? <div className="error-panel">{error}</div> : null}
          {success ? <div className="notice-box">{success}</div> : null}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Kaydediliyor..." : mode === "edit" ? "Kulübü Güncelle" : "Kulüp Oluştur"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
