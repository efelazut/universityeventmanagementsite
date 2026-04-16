import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchClubs } from "../services/resourceService";
import { MessageDrawer } from "./MessageDrawer";
import { NotificationPanel } from "./NotificationPanel";

function getRoleLabel(role) {
  if (role === "Admin") return "Yönetici";
  if (role === "ClubManager") return "Kulüp Yöneticisi";
  if (role === "Student") return "Öğrenci";
  return role;
}

export function Layout({ children }) {
  const { user, logout, apiBaseUrl, setApiBaseUrl } = useAuth();
  const { unreadMessageCount, unreadNotificationCount, openMessages, openNotifications } = useCommunicationCenter();
  const clubsQuery = useAsyncData(() => fetchClubs(apiBaseUrl), [apiBaseUrl]);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = useMemo(
    () =>
      user?.fullName
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("") || "MÜ",
    [user]
  );
  const clubs = Array.isArray(clubsQuery.data) ? clubsQuery.data : [];

  const navItems = [
    { to: "/home", title: "Ana Sayfa" },
    { to: "/events", title: "Etkinlikler" },
    { to: "/clubs", title: "Kulüpler" },
    { to: "/calendar", title: "Takvim" }
  ];

  if (user && ["Admin", "ClubManager"].includes(user.role)) {
    navItems.push({ to: "/dashboard", title: "Yönetim Paneli" });
    navItems.push({ to: "/rooms", title: "Salonlar" });
    navItems.push({ to: "/statistics", title: "İstatistikler" });
  }

  return (
    <div className="app-shell app-shell-refined">
      <aside className="sidebar sidebar-refined">
        <div className="sidebar-nav-shell">
          <span className="sidebar-label">Gezinme</span>
          <nav className="sidebar-nav sidebar-nav-refined">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className="sidebar-link sidebar-link-simple">
                <strong>{item.title}</strong>
              </NavLink>
            ))}
          </nav>
        </div>

        {user ? (
          <div className="sidebar-card sidebar-card-compact">
            <span className="sidebar-label">Rolünüz</span>
            <strong>{getRoleLabel(user.role)}</strong>
            <small>{user.role === "Student" ? "Kampüs akışını keşfedin." : "Yönetim araçlarına hızlı erişim açık."}</small>
          </div>
        ) : null}

        <div className="sidebar-card sidebar-card-compact">
          <span className="sidebar-label">API</span>
          <input className="api-input" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar topbar-refined">
          <div className="header-brand">
            <Link to="/home" className="brand brand-header">
              <span className="brand-mark">MÜ</span>
              <div>
                <p className="eyebrow">Maltepe Üniversitesi</p>
                <strong>Maltepe Etkinlik Platformu</strong>
                <small>Kulüpler, etkinlikler ve kampüs yaşamı tek akışta.</small>
              </div>
            </Link>
          </div>

          <div className="topbar-actions">
            {user ? (
              <>
                <button className="icon-action" onClick={() => openNotifications()}>
                  <span className="icon-action-mark">B</span>
                  <span>Bildirimler</span>
                  {unreadNotificationCount ? <span className="nav-badge">{unreadNotificationCount}</span> : null}
                </button>
                <button className="icon-action" onClick={() => openMessages()}>
                  <span className="icon-action-mark">M</span>
                  <span>Mesajlar</span>
                  {unreadMessageCount ? <span className="nav-badge">{unreadMessageCount}</span> : null}
                </button>
                <div className="profile-menu-shell">
                  <button className="avatar-button" onClick={() => setMenuOpen((value) => !value)}>
                    <span className="profile-avatar">{initials}</span>
                    <span className="avatar-copy">
                      <strong>Hesabım</strong>
                      <small>{getRoleLabel(user.role)}</small>
                    </span>
                  </button>
                  {menuOpen ? (
                    <div className="profile-menu">
                      <button
                        className="profile-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Profili Aç
                      </button>
                      <button
                        className="profile-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                          navigate("/login");
                        }}
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <Link to="/login" className="ghost-button link-button">
                Giriş Yap
              </Link>
            )}
          </div>
        </header>

        <main className="page-frame">{children}</main>
      </div>

      <NotificationPanel />
      <MessageDrawer clubs={clubs} />
    </div>
  );
}
