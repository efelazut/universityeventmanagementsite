import { Link } from "react-router-dom";
import { RatingStars } from "./RatingStars";
import { formatEventDate, formatEventTimeRange, getEventVisualState } from "../utils/eventPresentation";

const fallbackImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80";

export function EventCard({ event, actionLabel = "Etkinliği İncele", actionTo, footer, compact = false }) {
  const state = getEventVisualState(event);

  return (
    <article className={`event-card event-card-media ${state.cardClass} ${compact ? "event-card-compact" : ""}`.trim()}>
      <div className="event-media">
        <img src={event.imageUrl || fallbackImage} alt={event.title} loading="lazy" />
        <div className="event-visual-overlay" />
        <div className="event-media-overlay">
          <span className={`event-state-badge ${state.cardClass}`}>
            {state.badgeText}
            {state.cardClass === "event--active" ? <span className="live-pulse-dot" /> : null}
          </span>
          {event.category ? <span className="pill tone-dark">{event.category}</span> : null}
        </div>
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <p className="event-club-name">{event.clubName}</p>
          <h3>{event.title}</h3>
          <p className="event-summary">{event.description}</p>
        </div>

        <div className="event-info-grid">
          <div>
            <span>Tarih</span>
            <strong>{formatEventDate(event.startDate)}</strong>
          </div>
          <div>
            <span>Saat</span>
            <strong>{formatEventTimeRange(event.startDate, event.endDate)}</strong>
          </div>
          <div>
            <span>Yer</span>
            <strong>{event.format === "Online" ? "Online" : event.locationDetails || `${event.roomName} / ${event.building}`}</strong>
          </div>
          <div>
            <span>İlgi</span>
            {event.averageRating ? (
              <RatingStars value={event.averageRating} compact />
            ) : (
              <strong>{event.registrationCount} kayıt</strong>
            )}
          </div>
        </div>

        <div className="card-actions">
          <Link className="primary-button link-button" to={actionTo || `/events/${event.id}`}>
            {actionLabel}
          </Link>
          {footer}
        </div>
      </div>
    </article>
  );
}
