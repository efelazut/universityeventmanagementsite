import { apiRequest } from "./api";

export const fetchDashboard = (token, baseUrl) => apiRequest("/api/Statistics/dashboard", { token, baseUrl });
export const fetchClubStats = (token, baseUrl) => apiRequest("/api/Statistics/clubs", { token, baseUrl });
export const fetchEventStats = (token, baseUrl) => apiRequest("/api/Statistics/events", { token, baseUrl });
export const fetchRoomStats = (token, baseUrl) => apiRequest("/api/Statistics/rooms", { token, baseUrl });
export const fetchStudentStats = (token, baseUrl) => apiRequest("/api/Statistics/students", { token, baseUrl });
export const fetchMyStats = (token, baseUrl) => apiRequest("/api/Statistics/me", { token, baseUrl });
