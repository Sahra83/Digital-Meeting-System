// src/services/apiRequest.js
// Centralized wrapper for API requests used by the front‑end services.
// Adjust BASE_URL as needed for your backend endpoint.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.digitalmeeting24.com/api/v1";
const TOKEN_KEY = "auth-token";

/**
 * Generic API request helper.
 *
 * @param {string} endpoint Relative API path, e.g. "/participant/meetings"
 * @param {Object} [options] Fetch options such as method, headers, body, etc.
 * @returns {Promise<any>} Parsed JSON response or throws on network/HTTP error.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(localStorage.getItem(TOKEN_KEY) && { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })
  };

  const fetchOptions = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    // Keep FormData as-is so the browser can send the multipart boundary.
    body: options.body && !isFormData && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || `API error ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.error || message;
    } catch {
      const match = errorText.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        message = match[1].replace(/<[^>]*>/g, '').trim();
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  // Attempt to parse JSON; fallback to plain text if not JSON
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export async function apiDownload(endpoint, filename) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...(localStorage.getItem(TOKEN_KEY) && { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })
    }
  });

  if (!response.ok) {
    const error = new Error(await response.text());
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
