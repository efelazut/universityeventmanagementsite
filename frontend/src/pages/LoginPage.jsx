import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const testAccounts = [
  { label: "Yönetici", email: "admin@maltepe.edu.tr", password: "Admin123!", note: "Tüm yönetim ekranları" },
  { label: "Anka kulüp yöneticisi", email: "anka.yönetici@uniconnect.edu.tr", password: "Password1!", note: "Etkinlik ve kulüp yönetimi" },
  { label: "Sinema kulüp yöneticisi", email: "sinema.yönetici@uniconnect.edu.tr", password: "Password1!", note: "Kulüp rolü kontrolü" },
  { label: "Hukuk kulüp yöneticisi", email: "hukuk.yönetici@uniconnect.edu.tr", password: "Password1!", note: "Kulüp rolü kontrolü" },
  { label: "Öğrenci 1", email: "emre.tunc@student.maltepe.edu.tr", password: "Password1!", note: "Öğrenci deneyimi" },
  { label: "Öğrenci 2", email: "elif.acar@student.maltepe.edu.tr", password: "Password1!", note: "Öğrenci deneyimi" },
  { label: "Öğrenci 3", email: "deniz.kaya@student.maltepe.edu.tr", password: "Password1!", note: "Öğrenci deneyimi" }
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: testAccounts[0].email, password: testAccounts[0].password });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login(form);
      const target = location.state?.from || (auth.role === "Student" ? "/home" : "/dashboard");
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="hero-card">
        <p className="eyebrow">UniConnect</p>
        <h1>Kulüp ve etkinlik akışlarını tek merkezden yönetin.</h1>
        <p className="hero-text">
          Sunum ve kontrol için hazır test hesaplarından birini seçin. Her hesap gerçek SQL veritabanında kayıtlıdır.
        </p>

        <div className="hero-bullets">
          <div className="hero-bullet">
            <strong>Rol kontrolü</strong>
            <span>Yönetici, kulüp yöneticisi ve öğrenci ekranlarını ayrı ayrı deneyin.</span>
          </div>
          <div className="hero-bullet">
            <strong>Gerçek veri</strong>
            <span>Kulüpler, salonlar ve etkinlikler PostgreSQL veritabanı üzerinden gelir.</span>
          </div>
          <div className="hero-bullet">
            <strong>Sunuma hazır</strong>
            <span>UniConnect arayüzü kampüs etkinlikleri için sade ve anlaşılır şekilde düzenlendi.</span>
          </div>
        </div>

        <div className="demo-grid demo-grid-extended">
          {testAccounts.map((account) => (
            <button key={account.email} className="demo-account" type="button" onClick={() => setForm({ email: account.email, password: account.password })}>
              <strong>{account.label}</strong>
              <span>{account.note}</span>
              <small>{account.email}</small>
            </button>
          ))}
        </div>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Giriş</p>
        <h2>Oturum Aç</h2>
        <p className="section-description">Test hesabı seçebilir ya da bilgileri elle girebilirsiniz.</p>

        <label>
          E-posta
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Şifre
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Platforma Gir"}
        </button>
      </form>
    </div>
  );
}
