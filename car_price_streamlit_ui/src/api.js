//
// Simple API client for backend communication using native fetch
//

const DEFAULT_BASE = 'http://localhost:3001';

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns the backend base URL from the environment or a localhost fallback. */
  const envUrl = process.env.REACT_APP_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL;
  return (envUrl && envUrl.trim()) || DEFAULT_BASE;
}

// PUBLIC_INTERFACE
export async function getMetrics(signal) {
  /**
   * Fetches model metrics from the backend.
   * - signal: optional AbortSignal to cancel the request.
   * Returns parsed JSON or throws an error with message.
   */
  const url = `${getBackendBaseUrl()}/metrics`;
  try {
    const res = await fetch(url, { method: 'GET', signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Metrics request failed (${res.status}): ${txt || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to load metrics: ${err.message}`);
  }
}

// PUBLIC_INTERFACE
export async function predictPrice(payload, signal) {
  /**
   * Sends car feature payload to backend to get predicted price.
   * - payload: object with required fields (year, mileage, brand, model, fuel_type, transmission, owner_count, engine_size, seats)
   * - signal: optional AbortSignal
   * Returns parsed JSON or throws an error.
   */
  const url = `${getBackendBaseUrl()}/predict`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Prediction failed (${res.status}): ${txt || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to get prediction: ${err.message}`);
  }
}
