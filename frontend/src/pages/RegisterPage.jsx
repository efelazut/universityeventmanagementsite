import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerRequest } from "../services/authService";

const initialForm = {
  fullName: "",
  studentNumber: "",
  email: "",
  password: "",
  confirmPassword: ""
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && /^[\u0000-\u007F]+$/.test(value);
}

function validate(form) {
  if (!form.fullName.trim()) return "Ad soyad zorunludur.";
  if (!form.studentNumber.trim()) return "Öğrenci numarası zorunludur.";
  if (!/^[A-Za-z0-9-]+$/.test(form.studentNumber.trim())) return "Öğrenci numarası yalnızca harf, rakam ve tire içerebilir.";
  if (!isValidEmail(form.email.trim())) return "Geçerli ve Türkçe karakter içermeyen bir e-posta girin.";
  if (form.password.length < 6) return "Şifre en az 6 karakter olmalıdır.";
  if (form.password !== form.confirmPassword) return "Şifreler eşleşmiyor.";
  return "";
}

export function RegisterPage() {
  const { apiBaseUrl } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await registerRequest(
        {
          fullName: form.fullName.trim(),
          studentNumber: form.studentNumber.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword
        },
        apiBaseUrl
      );

      navigate("/login", {
        replace: true,
        state: {
          message: "Kayıt başarılı, giriş yapabilirsiniz.",
          identifier: form.email.trim().toLowerCase()
        }
      });
    } catch (err) {
      setError(err.message || "Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page register-page">
      <section className="hero-card">
        <p className="eyebrow">UniConnect</p>
        <h1>Üniversite kulüp dünyasına öğrenci hesabınızla katılın.</h1>
        <p className="hero-text">
          Kayıt olduktan sonra kulüpleri takip edebilir, etkinliklere kayıt olabilir ve kulüp ekipleriyle iletişime geçebilirsiniz.
        </p>
        <div className="hero-bullets">
          <div className="hero-bullet">
            <strong>Güvenli rol</strong>
            <span>Yeni hesaplar otomatik olarak öğrenci rolüyle açılır.</span>
          </div>
          <div className="hero-bullet">
            <strong>Tekil bilgiler</strong>
            <span>E-posta ve öğrenci numarası başka hesaplarda kullanılamaz.</span>
          </div>
          <div className="hero-bullet">
            <strong>Hazır altyapı</strong>
            <span>E-posta doğrulama ileride eklenebilecek temiz bir kayıt akışı kullanılır.</span>
          </div>
        </div>
      </section>

      <form className="login-card register-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Kayıt</p>
        <h2>Hesap Oluştur</h2>
        <p className="section-description">Öğrenci hesabınızı birkaç temel bilgiyle oluşturun.</p>

        <label>
          Ad Soyad
          <input type="text" value={form.fullName} onChange={handleChange("fullName")} autoComplete="name" />
        </label>
        <label>
          Öğrenci No
          <input type="text" value={form.studentNumber} onChange={handleChange("studentNumber")} autoComplete="username" />
        </label>
        <label>
          E-posta
          <input type="email" value={form.email} onChange={handleChange("email")} autoComplete="email" />
        </label>
        <label>
          Şifre
          <input type="password" value={form.password} onChange={handleChange("password")} autoComplete="new-password" />
        </label>
        <label>
          Şifre Tekrar
          <input type="password" value={form.confirmPassword} onChange={handleChange("confirmPassword")} autoComplete="new-password" />
        </label>

        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
        </button>
        <p className="auth-switch-text">
          Zaten hesabınız var mı? <Link to="/login">Giriş yapın</Link>
        </p>
      </form>
    </div>
  );
}
