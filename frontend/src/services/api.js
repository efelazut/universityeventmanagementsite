export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5052";

function normalizeBaseUrl(baseUrl) {
  const value = typeof baseUrl === "string" ? baseUrl.trim() : "";
  return value || DEFAULT_API_BASE_URL;
}

function buildUrl(baseUrl, path) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl).replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function getFriendlyApiError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed")) {
    return "Sunucuya ulaşılamıyor. API çalışıyor mu ve adres doğru mu kontrol edin.";
  }

  if (message.includes("401") || message.includes("unauthorized")) {
    return "Bu işlem için oturum açmanız gerekiyor.";
  }

  if (message.includes("403") || message.includes("forbidden")) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }

  if (message.includes("404") || message.includes("not found")) {
    return "İstenen kayıt bulunamadı.";
  }

  if (message.includes("500")) {
    return "Sunucuda beklenmeyen bir hata oluştu. Biraz sonra tekrar deneyin.";
  }

  return error?.message || "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

async function sendRequest(url, { method, body, token }) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  const response = await fetch(url, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {})
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error("[API 401]", {
        url,
        method,
        hasToken: Boolean(normalizedToken)
      });
    }

    throw new Error(
      typeof data === "string" ? data : data?.message || data?.title || `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function apiRequest(path, { method = "GET", body, token, baseUrl } = {}) {
  const primaryUrl = buildUrl(baseUrl, path);

  try {
    return await sendRequest(primaryUrl, { method, body, token });
  } catch (error) {
    const fallbackUrl = buildUrl(DEFAULT_API_BASE_URL, path);
    const shouldRetryWithDefault =
      primaryUrl !== fallbackUrl &&
      String(error?.message || "").toLowerCase().includes("failed to fetch");

    if (shouldRetryWithDefault) {
      console.warn("[API] primary base URL failed, retrying default API URL", {
        primaryUrl,
        fallbackUrl
      });

      try {
        return await sendRequest(fallbackUrl, { method, body, token });
      } catch (fallbackError) {
        throw new Error(getFriendlyApiError(fallbackError));
      }
    }

    throw new Error(getFriendlyApiError(error));
  }
}
