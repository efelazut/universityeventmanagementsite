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
    <article className={`event-card ${compact ? "event-card-compact" : ""}`.trim()}>
      <div className="event-media">
        <img
          src={imageSrc}
          alt={safeEvent.title}
          loading="lazy"
          className="event-media-img"
          onError={() => {
            if (imageSrc !== fallbackImage) {
              setImageSrc(fallbackImage);
            }
          }}
        />
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <div className="event-badges">
            <span className={`pill ${state.cardClass === "event--active" ? "tone-teal" : "tone-dark"}`}>
              {state.badgeText}
              {state.cardClass === "event--active" ? <span className="live-pulse-dot" /> : null}
            </span>
            {safeEvent.category ? <span className="pill tone-blue">{safeEvent.category}</span> : null}
          </div>
          <p className="event-club-name">{safeEvent.clubName}</p>
          <h3 className="event-title">{safeEvent.title}</h3>
          <p className="event-summary line-clamp-2">{safeEvent.description}</p>
        </div>

        <div className="event-info-list">
          <div className="event-info-item">
            <strong>Tarih:</strong> <span>{formatEventDate(safeEvent.startDate)}</span>
          </div>
          <div className="event-info-item">
            <strong>Saat:</strong> <span>{formatEventTimeRange(safeEvent.startDate, safeEvent.endDate)}</span>
          </div>
          <div className="event-info-item">
            <strong>Konum:</strong> <span>{safeEvent.format === "Online" ? "Online" : safeEvent.locationDetails || `${safeEvent.roomName}`}</span>
          </div>
        </div>

        <div className="card-actions">
          <Link className="primary-button link-button full-width-button" to={actionTo || `/events/${safeEvent.id}`}>
            {actionLabel}
          </Link>
          {footer}
        </div>
      </div>
    </article>
  );
}
