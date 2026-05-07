import { apiRequest } from "./api";

export function loginRequest(credentials, baseUrl) {
  return apiRequest("/api/Auth/login", {
    method: "POST",
    body: {
      emailOrStudentNumber: credentials.emailOrStudentNumber || credentials.email,
      email: credentials.emailOrStudentNumber || credentials.email,
      password: credentials.password
    },
    baseUrl
  });
}

export function registerRequest(payload, baseUrl) {
  return apiRequest("/api/Auth/register", {
    method: "POST",
    body: payload,
    baseUrl
  });
}
