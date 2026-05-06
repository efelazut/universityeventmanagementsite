import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatEventDate, getEventVisualState } from "../utils/eventPresentation";

const fallbackImages = {
  teknoloji: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=75",
  sanat: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=75",
  muzik: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=75",
  kariyer: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=75",
  default: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=75"
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

export function EventCard({ event, actionLabel = "Detay", actionTo, footer, compact = false }) {
  const organizerName = safeText(event?.clubName || event?.organizerText, "Duzenleyen bilgisi yok");
  const safeEvent = {
    id: Number(event?.id) || 0,
    title: safeText(event?.title, "Etkinlik adi guncelleniyor"),
    clubName: organizerName,
    description: safeText(event?.description, ""),
    category: safeText(event?.category, ""),
    format: safeText(event?.format, "Fiziksel"),
    locationDetails: safeText(event?.locationDetails || event?.locationText, ""),
    roomName: safeText(event?.roomName, ""),
    building: safeText(event?.building, ""),
    participantCount: event?.participantCount == null ? null : Number(event.participantCount),
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
  const visibleCount = safeEvent.participantCount ?? safeEvent.registrationCount;

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
          <div className="event-mini-meta">
            <span>{formatEventDate(safeEvent.startDate)}</span>
            {visibleCount ? <span>{visibleCount} katilim</span> : null}
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
