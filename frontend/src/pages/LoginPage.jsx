import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const demoAccounts = [
  { label: "Yönetici olarak giriş yap", email: "admin@maltepe.edu.tr", password: "Admin123!", note: "Sistem genel yönetimi" },
  { label: "Yazılım Kulübü yöneticisi", email: "selin.aydin@student.maltepe.edu.tr", password: "Password1!", note: "Yazılım ve Girişimcilik Kulübü" },
  { label: "Sinema Kulübü yöneticisi", email: "deniz.karaca@student.maltepe.edu.tr", password: "Password1!", note: "Sinema ve Görsel Sanatlar Kulübü" },
  { label: "Müzik Kulübü yöneticisi", email: "baris.cetin@student.maltepe.edu.tr", password: "Password1!", note: "Müzik ve Sahne Sanatları Kulübü" },
  { label: "Kariyer Kulübü yöneticisi", email: "zeynep.kaya@student.maltepe.edu.tr", password: "Password1!", note: "Kariyer ve İnovasyon Kulübü" },
  { label: "Öğrenci 1", email: "emre.tunc@student.maltepe.edu.tr", password: "Password1!", note: "Teknoloji odaklı öğrenci" },
  { label: "Öğrenci 2", email: "irem.sahin@student.maltepe.edu.tr", password: "Password1!", note: "Görsel sanatlar odaklı öğrenci" },
  { label: "Öğrenci 3", email: "onur.yalcin@student.maltepe.edu.tr", password: "Password1!", note: "Kariyer odaklı öğrenci" }
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: demoAccounts[0].email, password: demoAccounts[0].password });
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
        <p className="eyebrow">Maltepe Üniversitesi Platformu</p>
        <h1>Kulüp ve etkinlik akışlarını tek merkezden deneyimleyin.</h1>
        <p className="hero-text">
          Demo hesaplardan birini seçerek JWT oturumu açabilir, rol bazlı ekranları ve mesajlaşma ile bildirim akışlarını hızla test edebilirsiniz.
        </p>

        <div className="hero-bullets">
          <div className="hero-bullet">
            <strong>Hızlı rol testi</strong>
            <span>Yönetici, kulüp yöneticisi ve öğrenci akışlarını tek tıkla deneyin.</span>
          </div>
          <div className="hero-bullet">
            <strong>Mesaj ve bildirim senaryoları</strong>
            <span>Drawer tabanlı iletişim deneyimi ve okunmamış sayaçlarını hazır demo verilerle kontrol edin.</span>
          </div>
          <div className="hero-bullet">
            <strong>Sunuma hazır vitrin</strong>
            <span>Türkçe metinleri düzeltilmiş, büyük görselli ve role göre sadeleşen kampüs deneyimini görün.</span>
          </div>
        </div>

        <div className="demo-grid demo-grid-extended">
          {demoAccounts.map((account) => (
            <button key={account.email} className="demo-account" onClick={() => setForm({ email: account.email, password: account.password })}>
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
        <p className="section-description">Sağdaki formu doldurun veya soldaki demo hesaplardan birini seçin.</p>

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
          {loading ? "Giriş Yapılıyor..." : "Platforma Gir"}
        </button>
      </form>
    </div>
  );
}
