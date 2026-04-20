export async function apiRequest(path, { method = "GET", body, token, baseUrl } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  const response = await fetch(`${baseUrl}${path}`, {
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
        path,
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
