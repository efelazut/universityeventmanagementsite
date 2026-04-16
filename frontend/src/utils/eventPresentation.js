export function getEventVisualState(event) {
  const state = event.computedStatus || event.status;

  if (state === "Cancelled") {
    return {
      label: "İptal Edildi",
      badgeText: "⚠ İptal",
      tone: "tone-rose",
      cardClass: "event--cancelled"
    };
  }

  if (state === "Ongoing") {
    return {
      label: "Devam Ediyor",
      badgeText: "● Devam Ediyor",
      tone: "tone-gold",
      cardClass: "event--active"
    };
  }

  if (state === "Completed") {
    return {
      label: "Tamamlandı",
      badgeText: "✓ Tamamlandı",
      tone: "tone-dark",
      cardClass: "event--past"
    };
  }

  return {
    label: "Yaklaşan",
    badgeText: "Yaklaşan",
    tone: "tone-blue",
    cardClass: "event--upcoming"
  };
}

export function formatEventDate(value) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function formatEventTimeRange(startDate, endDate) {
  return `${new Date(startDate).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  })} - ${new Date(endDate).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}
