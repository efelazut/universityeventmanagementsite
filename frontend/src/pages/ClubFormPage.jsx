import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageUploadField } from "../components/ImageUploadField";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { createClub, fetchClubById, updateClub, uploadImage } from "../services/resourceService";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  showcaseSummary: "",
  highlightTitle: "",
  presidentName: "",
  presidentEmail: "",
  avatarUrl: "",
  bannerUrl: "",
  isActive: true
};

const emptyUploads = {
  avatarFile: null,
  bannerFile: null,
  avatarPreview: "",
  bannerPreview: "",
  avatarError: "",
  bannerError: ""
};

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

export function ClubFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiBaseUrl, user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [uploads, setUploads] = useState(emptyUploads);
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
          category: data.category || "",
          showcaseSummary: data.showcaseSummary || "",
          highlightTitle: data.highlightTitle || "",
          presidentName: data.presidentName || "",
          presidentEmail: data.presidentEmail || "",
          avatarUrl: data.avatarUrl || "",
          bannerUrl: data.bannerUrl || "",
          isActive: Boolean(data.isActive)
        });
        setUploads((current) => ({
          ...current,
          avatarPreview: data.avatarUrl || "",
          bannerPreview: data.bannerUrl || ""
        }));
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
    if (uploads.avatarError || uploads.bannerError) return uploads.avatarError || uploads.bannerError;
    return "";
  };

  const handleFileSelection = (key, previewKey, errorKey) => (event) => {
    const file = event.target.files?.[0] || null;
    const validation = validateImageFile(file);

    setUploads((current) => ({
      ...current,
      [key]: validation ? null : file,
      [previewKey]: validation ? current[previewKey] : file ? URL.createObjectURL(file) : "",
      [errorKey]: validation
    }));
  };

  const clearUpload = (key, previewKey, errorKey, urlKey) => () => {
    setUploads((current) => ({
      ...current,
      [key]: null,
      [previewKey]: form[urlKey] || "",
      [errorKey]: ""
    }));
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
      const avatarUpload = uploads.avatarFile
        ? await uploadImage(uploads.avatarFile, "clubs", user.token, apiBaseUrl)
        : null;
      const bannerUpload = uploads.bannerFile
        ? await uploadImage(uploads.bannerFile, "clubs", user.token, apiBaseUrl)
        : null;

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        showcaseSummary: form.showcaseSummary.trim(),
        highlightTitle: form.highlightTitle.trim(),
        presidentName: form.presidentName.trim(),
        presidentEmail: form.presidentEmail.trim(),
        avatarUrl: avatarUpload?.publicUrl || form.avatarUrl.trim(),
        bannerUrl: bannerUpload?.publicUrl || form.bannerUrl.trim(),
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
          <p>Kulüp kimliği, kapak görseli ve başkan bilgileri artık daha net ve görsel odaklı yönetiliyor.</p>
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
              Kategori
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Teknoloji, sanat, kariyer..." />
            </label>
          </div>

          <div className="form-grid two-column">
            <ImageUploadField
              label="Kulüp avatarı / logo"
              hint="Kulüp kartlarında ve profil alanlarında görünür."
              inputId="club-avatar-upload"
              previewUrl={uploads.avatarPreview}
              onFileChange={handleFileSelection("avatarFile", "avatarPreview", "avatarError")}
              onClear={clearUpload("avatarFile", "avatarPreview", "avatarError", "avatarUrl")}
              error={uploads.avatarError}
            />
            <ImageUploadField
              label="Kulüp kapak görseli"
              hint="Kulüp detay sayfasının üst yüzeyinde kullanılır."
              inputId="club-banner-upload"
              previewUrl={uploads.bannerPreview}
              onFileChange={handleFileSelection("bannerFile", "bannerPreview", "bannerError")}
              onClear={clearUpload("bannerFile", "bannerPreview", "bannerError", "bannerUrl")}
              error={uploads.bannerError}
            />
          </div>

          <div className="form-grid two-column">
            <label>
              Avatar URL
              <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="Opsiyonel yedek bağlantı" />
            </label>
            <label>
              Kapak görseli URL
              <input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="Opsiyonel yedek bağlantı" />
            </label>
          </div>

          <label>
            Kısa tanıtım
            <textarea rows="4" value={form.showcaseSummary} onChange={(e) => setForm({ ...form, showcaseSummary: e.target.value })} />
          </label>

          <label>
            Vitrin başlığı
            <input value={form.highlightTitle} onChange={(e) => setForm({ ...form, highlightTitle: e.target.value })} placeholder="Kulübü öne çıkaran kısa başlık" />
          </label>

          <label>
            Açıklama
            <textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div className="form-grid two-column">
            <label>
              Başkan Adı
              <input value={form.presidentName} onChange={(e) => setForm({ ...form, presidentName: e.target.value })} />
            </label>
            <label>
              Başkan E-postası
              <input type="email" value={form.presidentEmail} onChange={(e) => setForm({ ...form, presidentEmail: e.target.value })} />
            </label>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
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
