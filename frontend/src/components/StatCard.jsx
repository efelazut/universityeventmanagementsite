const ICONS = {
  event: "Et",
  attendance: "Kt",
  rating: "Pn",
  user: "Üy",
  room: "Sl",
  club: "Kl",
  calendar: "Tk",
  money: "₺"
};

function getVisualMeta(title = "", accent = "") {
  const source = `${title} ${accent}`.toLocaleLowerCase("tr-TR");

  if (source.includes("puan") || source.includes("rating")) {
    return { icon: ICONS.rating, label: "Puan", progress: 82, trend: "+0.4" };
  }

  if (source.includes("katılım") || source.includes("kayıt") || source.includes("attendance")) {
    return { icon: ICONS.attendance, label: "Katılım", progress: 76, trend: "+12%" };
  }

  if (source.includes("öğrenci") || source.includes("üye") || source.includes("kullanıcı")) {
    return { icon: ICONS.user, label: "Kullanıcı", progress: 68, trend: "+8%" };
  }

  if (source.includes("salon") || source.includes("room")) {
    return { icon: ICONS.room, label: "Salon", progress: 61, trend: "+5%" };
  }

  if (source.includes("kulüp") || source.includes("club")) {
    return { icon: ICONS.club, label: "Kulüp", progress: 73, trend: "+6%" };
  }

  if (source.includes("takvim") || source.includes("yaklaşan") || source.includes("plan")) {
    return { icon: ICONS.calendar, label: "Takvim", progress: 64, trend: "+3%" };
  }

  if (source.includes("ücret") || source.includes("bütçe") || source.includes("maliyet")) {
    return { icon: ICONS.money, label: "Bütçe", progress: 58, trend: "-2%" };
  }

  return { icon: ICONS.event, label: "Etkinlik", progress: 70, trend: "+7%" };
}

export function StatCard({ title, value, accent, subtitle, meta }) {
  const visual = getVisualMeta(title, accent);

  return (
    <div className={`stat-card ${accent || ""}`}>
      <div className="stat-card-top">
        <div className="stat-card-kicker">
          <span className="stat-card-icon" aria-hidden="true">{visual.icon}</span>
          <span>{visual.label}</span>
        </div>
        <span className="stat-card-trend">{visual.trend}</span>
      </div>

      <div className="stat-card-main">
        <span className="stat-card-title">{title}</span>
        <strong>{value}</strong>
      </div>

      {(subtitle || meta) ? (
        <div className="stat-card-copy">
          {subtitle ? <small>{subtitle}</small> : null}
          {meta ? <em>{meta}</em> : null}
        </div>
      ) : null}

      <div className="stat-progress" aria-hidden="true">
        <div className="stat-progress-track">
          <div className="stat-progress-fill" style={{ width: `${visual.progress}%` }} />
        </div>
        <div className="stat-progress-spark">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
