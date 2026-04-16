import { apiRequest } from "./api";

export function loginRequest(credentials, baseUrl) {
  return apiRequest("/api/Auth/login", {
    method: "POST",
    body: credentials,
    baseUrl
  });
}
