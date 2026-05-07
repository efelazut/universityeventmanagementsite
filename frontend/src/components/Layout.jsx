import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunicationCenter } from "../context/CommunicationCenterContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { fetchClubs, fetchMyProfile } from "../services/resourceService";
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
  const profileQuery = useAsyncData(
    () => (user?.token ? fetchMyProfile(user.token, apiBaseUrl) : Promise.resolve(null)),
    [user?.token, apiBaseUrl]
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
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
  const managedClubs = useMemo(() => {
    if (Array.isArray(profileQuery.data?.managedClubs)) {
      return profileQuery.data.managedClubs;
    }

    const fromAuth = Array.isArray(user?.managedClubs) ? user.managedClubs : [];
    if (fromAuth.length) return fromAuth;

    if (user?.clubId && user.role === "ClubManager") {
      const club = clubs.find((item) => item.id === user.clubId);
      return [{ clubId: user.clubId, clubName: club?.name || "Kulübüm", role: "Manager" }];
    }

    return [];
  }, [clubs, profileQuery.data?.managedClubs, user?.clubId, user?.managedClubs, user?.role]);

  const openMyClub = () => {
    setMenuOpen(false);
    navigate(managedClubs.length ? `/clubs/${managedClubs[0].clubId}` : "/clubs");
  };

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

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

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
              <img className="brand-logo" src="/logo-navbar.png" alt="" aria-hidden="true" />
              <span className="brand-title">UniConnect</span>
            </Link>

            <button
              className="mobile-nav-toggle"
              type="button"
              aria-label={navOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>

            <nav className={`navbar-nav ${navOpen ? "is-open" : ""}`}>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className="navbar-link" onClick={() => setNavOpen(false)}>
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="navbar-right">
            {user ? (
              <>
                <button className="icon-action" type="button" onClick={() => openNotifications()} title="Bildirimler">
                  <svg className="icon-action-symbol" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 10.5V9a6 6 0 0 0-12 0v1.5c0 2.2-.7 3.5-1.5 4.5-.5.6-.1 1.5.7 1.5h13.6c.8 0 1.2-.9.7-1.5-.8-1-1.5-2.3-1.5-4.5Z" />
                    <path d="M9.5 19a2.7 2.7 0 0 0 5 0" />
                  </svg>
                  {unreadNotificationCount ? <span className="nav-badge">{unreadNotificationCount}</span> : null}
                </button>
                <button className="icon-action" type="button" onClick={() => openMessages()} title="Mesajlar">
                  <svg className="icon-action-symbol" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.8 6.5h14.4c.7 0 1.3.6 1.3 1.3v8.4c0 .7-.6 1.3-1.3 1.3H4.8c-.7 0-1.3-.6-1.3-1.3V7.8c0-.7.6-1.3 1.3-1.3Z" />
                    <path d="m5 8 7 5 7-5" />
                  </svg>
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
                        Profilim
                      </button>
                      {managedClubs.length ? (
                        <button
                          className="profile-menu-item"
                          type="button"
                          role="menuitem"
                          onClick={openMyClub}
                        >
                          Kulübüm
                        </button>
                      ) : null}
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
