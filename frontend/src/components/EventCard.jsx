import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RatingStars } from "./RatingStars";
import { formatEventDate, formatEventTimeRange, getEventVisualState } from "../utils/eventPresentation";

const fallbackImages = {
  teknoloji: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  sanat: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  muzik: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  kariyer: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
};

function resolveFallback(category) {
  const normalized = String(category || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("muzik") || normalized.includes("sahne")) return fallbackImages.muzik;
  if (normalized.includes("kariyer") || normalized.includes("inovasyon")) return fallbackImages.kariyer;
  if (normalized.includes("sanat") || normalized.includes("sinema")) return fallbackImages.sanat;
  if (normalized.includes("teknoloji") || normalized.includes("yazilim")) return fallbackImages.teknoloji;
  return fallbackImages.default;
}

function safeText(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

export function EventCard({ event, actionLabel = "Etkinliği İncele", actionTo, footer, compact = false }) {
  const safeEvent = {
    id: Number(event?.id) || 0,
    title: safeText(event?.title, "Etkinlik adı güncelleniyor"),
    clubName: safeText(event?.clubName, "Kulüp bilgisi hazırlanıyor"),
    description: safeText(event?.description, "Etkinlik açıklaması henüz eklenmedi."),
    category: safeText(event?.category, ""),
    format: safeText(event?.format, "Fiziksel"),
    locationDetails: safeText(event?.locationDetails, ""),
    roomName: safeText(event?.roomName, "Salon"),
    building: safeText(event?.building, "Kampüs"),
    averageRating: Number(event?.averageRating) || 0,
    registrationCount: Number(event?.registrationCount) || 0,
    startDate: event?.startDate || new Date().toISOString(),
    endDate: event?.endDate || event?.startDate || new Date().toISOString(),
    imageUrl: safeText(event?.imageUrl, ""),
    computedStatus: safeText(event?.computedStatus, event?.status || "Upcoming"),
    status: safeText(event?.status, "Upcoming")
  };

  const state = getEventVisualState(safeEvent);
  const fallbackImage = useMemo(() => resolveFallback(safeEvent.category), [safeEvent.category]);
  const [imageSrc, setImageSrc] = useState(safeEvent.imageUrl || fallbackImage);

  return (
    <article className={`event-card event-card-media ${state.cardClass} ${compact ? "event-card-compact" : ""}`.trim()}>
      <div className="event-media">
        <img
          src={imageSrc}
          alt={safeEvent.title}
          loading="lazy"
          onError={() => {
            if (imageSrc !== fallbackImage) {
              setImageSrc(fallbackImage);
            }
          }}
        />
        <div className="event-visual-overlay" />
        <div className="event-media-overlay">
          <span className={`event-state-badge ${state.cardClass}`}>
            {state.badgeText}
            {state.cardClass === "event--active" ? <span className="live-pulse-dot" /> : null}
          </span>
          {safeEvent.category ? <span className="pill tone-dark">{safeEvent.category}</span> : null}
        </div>
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <p className="event-club-name">{safeEvent.clubName}</p>
          <h3>{safeEvent.title}</h3>
          <p className="event-summary">{safeEvent.description}</p>
        </div>

        <div className="event-info-grid">
          <div>
            <span>Tarih</span>
            <strong>{formatEventDate(safeEvent.startDate)}</strong>
          </div>
          <div>
            <span>Saat</span>
            <strong>{formatEventTimeRange(safeEvent.startDate, safeEvent.endDate)}</strong>
          </div>
          <div>
            <span>Yer</span>
            <strong>{safeEvent.format === "Online" ? "Online" : safeEvent.locationDetails || `${safeEvent.roomName} / ${safeEvent.building}`}</strong>
          </div>
          <div>
            <span>İlgi</span>
            {safeEvent.averageRating ? (
              <RatingStars value={safeEvent.averageRating} compact />
            ) : (
              <strong>{safeEvent.registrationCount} kayıt</strong>
            )}
          </div>
        </div>

        <div className="card-actions">
          <Link className="primary-button link-button" to={actionTo || `/events/${safeEvent.id}`}>
            {actionLabel}
          </Link>
          {footer}
        </div>
      </div>
    </article>
  );
}
