import { apiRequest } from "./api";

export const fetchHomeFeed = (baseUrl) => apiRequest("/api/Home", { baseUrl });

export const fetchEvents = (baseUrl) => apiRequest("/api/Events", { baseUrl });
export const fetchClubs = (baseUrl) => apiRequest("/api/Clubs", { baseUrl });
export const fetchPastEvents = (baseUrl) => apiRequest("/api/Events/past", { baseUrl });
export const fetchUpcomingEvents = (baseUrl) => apiRequest("/api/Events/upcoming", { baseUrl });
export const fetchEventById = (id, baseUrl) => apiRequest(`/api/Events/${id}`, { baseUrl });
export const fetchEventRegistrations = (id, baseUrl) => apiRequest(`/api/Events/${id}/registrations`, { baseUrl });
export const createEvent = (payload, token, baseUrl) =>
  apiRequest("/api/Events", { method: "POST", body: payload, token, baseUrl });
export const updateEvent = (id, payload, token, baseUrl) =>
  apiRequest(`/api/Events/${id}`, { method: "PUT", body: payload, token, baseUrl });
export const deleteEvent = (id, token, baseUrl) =>
  apiRequest(`/api/Events/${id}`, { method: "DELETE", token, baseUrl });

export const createRegistration = (payload, token, baseUrl) =>
  apiRequest("/api/Registrations", { method: "POST", body: payload, token, baseUrl });
export const cancelMyRegistration = (eventId, token, baseUrl) =>
  apiRequest(`/api/Registrations/event/${eventId}/me`, { method: "DELETE", token, baseUrl });
export const decideRegistration = (registrationId, decision, token, baseUrl) =>
  apiRequest(`/api/Registrations/${registrationId}/${decision}`, { method: "POST", token, baseUrl });
export const markAttendance = (eventId, userId, token, baseUrl) =>
  apiRequest(`/api/Events/${eventId}/attendance/${userId}`, { method: "POST", token, baseUrl });

export const fetchClubById = (id, baseUrl) => apiRequest(`/api/Clubs/${id}`, { baseUrl });
export const fetchClubMembers = (id, baseUrl) => apiRequest(`/api/Clubs/${id}/members`, { baseUrl });
export const fetchClubEvents = (id, baseUrl) => apiRequest(`/api/Clubs/${id}/events`, { baseUrl });
export const fetchClubStatistics = (id, baseUrl) => apiRequest(`/api/Clubs/${id}/statistics`, { baseUrl });
export const createClub = (payload, token, baseUrl) =>
  apiRequest("/api/Clubs", { method: "POST", body: payload, token, baseUrl });
export const updateClub = (id, payload, token, baseUrl) =>
  apiRequest(`/api/Clubs/${id}`, { method: "PUT", body: payload, token, baseUrl });
export const joinClub = (id, token, baseUrl) =>
  apiRequest(`/api/Clubs/${id}/join`, { method: "POST", token, baseUrl });
export const assignClubOfficer = (id, payload, token, baseUrl) =>
  apiRequest(`/api/Clubs/${id}/officers`, { method: "POST", body: payload, token, baseUrl });
export const removeClubMembership = (clubId, membershipId, token, baseUrl) =>
  apiRequest(`/api/Clubs/${clubId}/members/${membershipId}`, { method: "DELETE", token, baseUrl });
export const assignClubPresident = (clubId, userId, token, baseUrl) =>
  apiRequest(`/api/Clubs/${clubId}/president/${userId}`, { method: "POST", token, baseUrl });

export const fetchRooms = (baseUrl) => apiRequest("/api/Rooms", { baseUrl });
export const fetchRoomById = (id, baseUrl) => apiRequest(`/api/Rooms/${id}`, { baseUrl });
export const fetchRoomAvailability = (baseUrl) => apiRequest("/api/Rooms/availability", { baseUrl });
export const fetchRoomPopularity = (baseUrl) => apiRequest("/api/Rooms/popularity", { baseUrl });
export const createRoom = (payload, token, baseUrl) =>
  apiRequest("/api/Rooms", { method: "POST", body: payload, token, baseUrl });
export const updateRoom = (id, payload, token, baseUrl) =>
  apiRequest(`/api/Rooms/${id}`, { method: "PUT", body: payload, token, baseUrl });

export const fetchMyProfile = (token, baseUrl) => apiRequest("/api/Users/me", { token, baseUrl });
export const fetchMyEvents = (token, baseUrl) => apiRequest("/api/Users/me/events", { token, baseUrl });

export const fetchEventReviews = (eventId, baseUrl) => apiRequest(`/api/events/${eventId}/reviews`, { baseUrl });
export const createEventReview = (eventId, payload, token, baseUrl) =>
  apiRequest(`/api/events/${eventId}/reviews`, { method: "POST", body: payload, token, baseUrl });

export const fetchNotifications = (token, baseUrl) =>
  apiRequest("/api/Notifications", { token, baseUrl });
export const markNotificationRead = (id, token, baseUrl) =>
  apiRequest(`/api/Notifications/${id}/read`, { method: "POST", token, baseUrl });
export const markAllNotificationsRead = (token, baseUrl) =>
  apiRequest("/api/Notifications/read-all", { method: "POST", token, baseUrl });

export const fetchMessageThreads = (token, baseUrl) =>
  apiRequest("/api/Messages", { token, baseUrl });
export const fetchMessageThread = (id, token, baseUrl) =>
  apiRequest(`/api/Messages/${id}`, { token, baseUrl });
export const createMessageThread = (payload, token, baseUrl) =>
  apiRequest("/api/Messages", { method: "POST", body: payload, token, baseUrl });
export const sendThreadMessage = (id, payload, token, baseUrl) =>
  apiRequest(`/api/Messages/${id}/messages`, { method: "POST", body: payload, token, baseUrl });
