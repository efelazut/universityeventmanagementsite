import { useEffect, useMemo, useRef, useState } from "react";
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
  const menuRef = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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
    <div className="app-shell app-shell-navbar">
      <header className="top-navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/home" className="brand brand-header">
              <span className="brand-mark">MÜ</span>
              <div>
                <strong>Maltepe Etkinlik</strong>
              </div>
            </Link>

            <nav className="navbar-nav">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className="navbar-link">
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="navbar-right">
            {user ? (
              <>
                <button className="icon-action" type="button" onClick={() => openNotifications()} title="Bildirimler">
                  <span className="icon-action-mark">B</span>
                  {unreadNotificationCount ? <span className="nav-badge">{unreadNotificationCount}</span> : null}
                </button>
                <button className="icon-action" type="button" onClick={() => openMessages()} title="Mesajlar">
                  <span className="icon-action-mark">M</span>
                  {unreadMessageCount ? <span className="nav-badge">{unreadMessageCount}</span> : null}
                </button>

                <div className={`profile-menu-shell ${menuOpen ? "is-open" : ""}`} ref={menuRef}>
                  <button
                    className="avatar-button"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    <span className="profile-avatar">{initials}</span>
                    <span className="avatar-copy">
                      <strong>{user.fullName}</strong>
                      <small>{getRoleLabel(user.role)}</small>
                    </span>
                  </button>

                  {menuOpen ? (
                    <div className="profile-menu" role="menu">
                      <div className="profile-menu-header">
                        <span className="profile-avatar profile-avatar-mini">{initials}</span>
                        <div>
                          <strong>{user.fullName}</strong>
                          <small>{getRoleLabel(user.role)}</small>
                        </div>
                      </div>

                      <button
                        className="profile-menu-item"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Profili Aç
                      </button>
                      <button
                        className="profile-menu-item"
                        type="button"
                        role="menuitem"
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
        </div>
      </header>

      <main className="page-frame">{children}</main>

      <NotificationPanel />
      <MessageDrawer clubs={clubs} />
    </div>
  );
}
