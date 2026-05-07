import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchMyEvents, fetchMyProfile, updateMyAcademicInfo, updateMyPassword, updateMyProfile } from "../services/resourceService";

function roleLabel(role) {
  if (role === "Admin") return "Yönetici";
  if (role === "ClubManager") return "Kulüp Yöneticisi";
  if (role === "Student") return "Öğrenci";
  return role;
}

function formatEventDate(value) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const departmentsByFaculty = {
  "Mühendislik ve Doğa Bilimleri Fakültesi": [
    "Yazılım Mühendisliği",
    "Bilgisayar Mühendisliği",
    "Endüstri Mühendisliği",
    "Elektrik-Elektronik Mühendisliği"
  ],
  "İşletme ve Yönetim Bilimleri Fakültesi": [
    "İşletme",
    "Uluslararası Ticaret ve Lojistik",
    "Ekonomi ve Finans",
    "Siyaset Bilimi ve Uluslararası İlişkiler"
  ],
  "Hukuk Fakültesi": ["Hukuk"],
  "İletişim Fakültesi": ["Halkla İlişkiler ve Tanıtım", "Görsel İletişim Tasarımı", "Radyo, Televizyon ve Sinema"],
  "Mimarlık ve Tasarım Fakültesi": ["Mimarlık", "İç Mimarlık", "Endüstriyel Tasarım"],
  "Eğitim Fakültesi": ["Rehberlik ve Psikolojik Danışmanlık", "Okul Öncesi Öğretmenliği", "İngilizce Öğretmenliği"],
  "İnsan ve Toplum Bilimleri Fakültesi": ["Psikoloji", "Sosyoloji", "Felsefe"],
  "Güzel Sanatlar Fakültesi": ["Grafik Tasarımı", "Sahne Sanatları", "Plastik Sanatlar"],
  "Tıp Fakültesi": ["Tıp"],
  "Hemşirelik Yüksekokulu": ["Hemşirelik"],
  "Meslek Yüksekokulu": ["Bilgisayar Programcılığı", "Dış Ticaret", "Grafik Tasarımı"]
};

const facultyOptions = Object.keys(departmentsByFaculty);
const yearClassOptions = ["Hazırlık", "1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "Mezun"];

function EventActivitySection({ title, description, items, emptyTitle, emptyDescription }) {
  return (
    <SectionCard title={title} description={description}>
      <div className="stack-list">
        {items.length ? (
          items.map((item) => (
            <Link key={`${title}-${item.id}-${item.registeredAt || item.startDate}`} className="list-row" to={`/events/${item.id}`}>
              <strong>{item.title}</strong>
              <span>{formatEventDate(item.startDate)}</span>
              <span>{item.attended ? "Fiilen katıldınız" : "Kayıt durumunuz aktif"}</span>
            </Link>
          ))
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </SectionCard>
  );
}

export function ProfilePage() {
  const { apiBaseUrl, user } = useAuth();
  const profileQuery = useAsyncData(() => fetchMyProfile(user.token, apiBaseUrl), [user?.token, apiBaseUrl]);
  const eventsQuery = useAsyncData(() => fetchMyEvents(user.token, apiBaseUrl), [user?.token, apiBaseUrl]);
  const [emailForm, setEmailForm] = useState("");
  const [academicForm, setAcademicForm] = useState({ faculty: "", department: "", yearClass: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [academicFeedback, setAcademicFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.email) {
      setEmailForm(profileQuery.data.email);
    }
  }, [profileQuery.data?.email]);

  useEffect(() => {
    if (profileQuery.data) {
      const faculty = facultyOptions.includes(profileQuery.data.faculty) ? profileQuery.data.faculty : "";
      const departmentOptions = faculty ? departmentsByFaculty[faculty] : [];
      const department = departmentOptions.includes(profileQuery.data.department) ? profileQuery.data.department : "";
      const yearClass = yearClassOptions.includes(profileQuery.data.yearClass) ? profileQuery.data.yearClass : "";

      setAcademicForm({
        faculty,
        department,
        yearClass
      });
    }
  }, [profileQuery.data]);

  if (profileQuery.loading || eventsQuery.loading) {
    return <div className="loading-state loading-state-large">Profil verileri hazırlanıyor...</div>;
  }

  if (profileQuery.error || eventsQuery.error) {
    return <div className="error-panel">{profileQuery.error || eventsQuery.error}</div>;
  }

  const profile = profileQuery.data;
  const activity = eventsQuery.data;

  const handleEmailUpdate = async (event) => {
    event.preventDefault();
    setProfileFeedback(null);
    const nextEmail = emailForm.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail) || !/^[\u0000-\u007F]+$/.test(nextEmail)) {
      setProfileFeedback({ type: "error", text: "Geçerli ve Türkçe karakter içermeyen bir e-posta girin." });
      return;
    }

    setSavingEmail(true);
    try {
      await updateMyProfile({ email: nextEmail }, user.token, apiBaseUrl);
      setProfileFeedback({ type: "success", text: "E-posta adresiniz güncellendi." });
      await profileQuery.reload();
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "E-posta güncellenemedi." });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleAcademicUpdate = async (event) => {
    event.preventDefault();
    setAcademicFeedback(null);

    if (academicForm.department && !academicForm.faculty) {
      setAcademicFeedback({ type: "error", text: "Bölüm seçmek için önce fakülte seçin." });
      return;
    }

    setSavingAcademic(true);

    try {
      await updateMyAcademicInfo(
        {
          faculty: academicForm.faculty.trim(),
          department: academicForm.department.trim(),
          yearClass: academicForm.yearClass.trim()
        },
        user.token,
        apiBaseUrl
      );
      setAcademicFeedback({ type: "success", text: "Akademik bilgileriniz güncellendi." });
      await profileQuery.reload();
    } catch (err) {
      setAcademicFeedback({ type: "error", text: err.message || "Akademik bilgiler güncellenemedi." });
    } finally {
      setSavingAcademic(false);
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordFeedback({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordFeedback({ type: "error", text: "Yeni şifre mevcut şifreyle aynı olamaz." });
      return;
    }

    setSavingPassword(true);
    try {
      await updateMyPassword(passwordForm, user.token, apiBaseUrl);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setPasswordFeedback({ type: "success", text: "Şifreniz başarıyla güncellendi." });
    } catch (err) {
      setPasswordFeedback({ type: "error", text: err.message || "Şifre güncellenemedi." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="detail-hero detail-hero-rich">
        <div>
          <p className="eyebrow">Profil</p>
          <h1>{profile.fullName}</h1>
          <p>
            Akademik bilgileriniz, rolünüz, kulüp bağınız ve etkinlik geçmişiniz tek bir düzen içinde daha okunur
            şekilde sunulur.
          </p>
        </div>
        <div className="profile-identity-card">
          <span className="profile-avatar profile-avatar-large">
            {profile.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <strong>{roleLabel(profile.role)}</strong>
            <p>{profile.email}</p>
            <span className={`pill ${profile.isActiveMember ? "active" : "inactive"}`}>
              {profile.isActiveMember ? "Aktif kullanıcı" : "Pasif kullanıcı"}
            </span>
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard title="Kayıtlı etkinlik" value={activity.registeredEvents.length} accent="teal" subtitle="Toplam kayıt geçmişi" />
        <StatCard title="Katıldığım etkinlik" value={activity.attendedEvents.length} accent="blue" subtitle="İşlenmiş katılım" />
        <StatCard title="Yaklaşan plan" value={activity.upcomingRegistrations.length} accent="orange" subtitle="Ajandadaki kayıtlar" />
        <StatCard title="Kulüp bağı" value={profile.clubName || "Genel"} accent="rose" subtitle="Profilinizde görünen ilişki" />
      </div>

      <div className="profile-grid">
        <SectionCard title="Kişisel bilgiler" description="Kimlik ve hesap görünümünüz.">
          <div className="detail-table">
            <div><span>Ad soyad</span><strong>{profile.fullName}</strong></div>
            <div><span>E-posta</span><strong>{profile.email}</strong></div>
            <div><span>Öğrenci numarası</span><strong>{profile.studentNumber || "Belirtilmedi"}</strong></div>
            <div><span>Rol</span><strong>{roleLabel(profile.role)}</strong></div>
            <div><span>Hesap durumu</span><strong>{profile.isActiveMember ? "Aktif" : "Pasif"}</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="Hesap bilgileri" description="E-postanızı güncelleyebilirsiniz; öğrenci numarası ve rol değiştirilemez.">
          <form className="compact-form" onSubmit={handleEmailUpdate}>
            <label>
              Ad soyad
              <input type="text" value={profile.fullName} disabled />
            </label>
            <label>
              Öğrenci numarası
              <input type="text" value={profile.studentNumber || ""} disabled />
            </label>
            <label>
              E-posta
              <input type="email" value={emailForm} onChange={(event) => setEmailForm(event.target.value)} />
            </label>
            {profileFeedback ? (
              <div className={profileFeedback.type === "success" ? "notice-box" : "error-text"}>{profileFeedback.text}</div>
            ) : null}
            <button className="primary-button" type="submit" disabled={savingEmail || emailForm.trim().toLowerCase() === profile.email.toLowerCase()}>
              {savingEmail ? "Güncelleniyor..." : "E-postayı Güncelle"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Akademik bilgiler" description="Öğrenci veya yönetici hesabına ait akademik alanlar.">
          <form className="compact-form" onSubmit={handleAcademicUpdate}>
            <label>
              Fakülte
              <select
                value={academicForm.faculty}
                onChange={(event) => setAcademicForm({ ...academicForm, faculty: event.target.value, department: "" })}
              >
                <option value="">Belirtilmedi</option>
                {facultyOptions.map((faculty) => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
            </label>
            <label>
              Bölüm
              <select
                value={academicForm.department}
                onChange={(event) => setAcademicForm({ ...academicForm, department: event.target.value })}
                disabled={!academicForm.faculty}
              >
                <option value="">Belirtilmedi</option>
                {(departmentsByFaculty[academicForm.faculty] || []).map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>
            <label>
              Öğrenci numarası
              <input type="text" value={profile.studentNumber || "Belirtilmedi"} disabled />
            </label>
            <label>
              Sınıf / yıl
              <select
                value={academicForm.yearClass}
                onChange={(event) => setAcademicForm({ ...academicForm, yearClass: event.target.value })}
              >
                <option value="">Belirtilmedi</option>
                {yearClassOptions.map((yearClass) => (
                  <option key={yearClass} value={yearClass}>{yearClass}</option>
                ))}
              </select>
            </label>
            {academicFeedback ? (
              <div className={academicFeedback.type === "success" ? "notice-box" : "error-text"}>{academicFeedback.text}</div>
            ) : null}
            <button className="primary-button" type="submit" disabled={savingAcademic}>
              {savingAcademic ? "Güncelleniyor..." : "Akademik Bilgileri Güncelle"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Şifre değiştir" description="Hesabınızı korumak için güçlü ve yalnızca size ait bir şifre kullanın.">
          <form className="compact-form" onSubmit={handlePasswordUpdate}>
            <label>
              Mevcut şifre
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                autoComplete="current-password"
              />
            </label>
            <label>
              Yeni şifre
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                autoComplete="new-password"
              />
            </label>
            <label>
              Yeni şifre tekrar
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmNewPassword: event.target.value })}
                autoComplete="new-password"
              />
            </label>
            {passwordFeedback ? (
              <div className={passwordFeedback.type === "success" ? "notice-box" : "error-text"}>{passwordFeedback.text}</div>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword}
            >
              {savingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Kulüp ilişkim" description="Sistemdeki kulüp bağınız ve yetki kapsamınız.">
          <div className="detail-table">
            <div><span>Bağlı kulüp</span><strong>{profile.clubName || "Kulüp bağlantısı yok"}</strong></div>
            <div><span>İlişki tipi</span><strong>{profile.clubName ? "Yönetim ekibi" : "Bağımsız kullanıcı"}</strong></div>
            <div><span>Yetki alanı</span><strong>{profile.role === "Admin" ? "Tüm platform" : "Rol bazlı erişim"}</strong></div>
          </div>
        </SectionCard>
      </div>

      <div className="two-column">
        <EventActivitySection
          title="Katıldığım etkinlikler"
          description="Tamamlanmış ve katılımı işlenmiş etkinlik geçmişiniz."
          items={activity.attendedEvents}
          emptyTitle="Henüz işlenmiş katılım yok."
          emptyDescription="Etkinlikler tamamlanıp katılım işlendiğinde geçmişiniz burada listelenecek."
        />
        <EventActivitySection
          title="Yaklaşan kayıtlarım"
          description="Ajandanızda duran aktif kayıtlar."
          items={activity.upcomingRegistrations}
          emptyTitle="Yaklaşan kayıt bulunmuyor."
          emptyDescription="Yeni etkinliklere kayıt olduğunuzda yaklaşan planlarınız burada görünür."
        />
      </div>

      <EventActivitySection
        title="Tüm kayıtlı etkinliklerim"
        description="Kayıt oluşturduğunuz bütün etkinliklerin genel listesi."
        items={activity.registeredEvents}
        emptyTitle="Kayıtlı etkinlik bulunmuyor."
        emptyDescription="Henüz herhangi bir etkinliğe kayıt olmadığınız için bu alan boş görünüyor."
      />
    </div>
  );
}
