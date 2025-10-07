/**
 * Simple API client for backend communication using native fetch.
 * Ensures payload and responses align with Flask backend schemas.
 */

const DEFAULT_BASE = 'http://localhost:3001';

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns the backend base URL from the environment or a localhost fallback. */
  const envUrl = process.env.REACT_APP_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL;
  return (envUrl && envUrl.trim()) || DEFAULT_BASE;
}

// PUBLIC_INTERFACE
export async function getHealth(signal) {
  /**
   * Basic health check to confirm server is reachable.
   */
  const url = `${getBackendBaseUrl()}/`;
  try {
    const res = await fetch(url, { method: 'GET', signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Health request failed (${res.status}): ${txt || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to reach backend: ${err.message}`);
  }
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
export function toBackendPredictPayload(formPayload) {
  /**
   * Transforms UI payload to backend schema:
   * - mileage -> mileage_km
   * - engine_size (liters) -> engine_cc (cc)
   * Leaves other keys as-is.
   */
  const {
    year,
    mileage,
    brand,
    model,
    fuel_type,
    transmission,
    owner_count,
    engine_size,
    seats
  } = formPayload || {};

  const engineCc = Number(engine_size) * 1000; // liters to cc
  return {
    brand,
    model,
    fuel_type,
    transmission,
    year: Number(year),
    mileage_km: Number(mileage),
    owner_count: Number(owner_count),
    engine_cc: Number.isFinite(engineCc) ? engineCc : undefined,
    seats: Number(seats)
  };
}

// PUBLIC_INTERFACE
export async function predictPrice(formPayload, signal) {
  /**
   * Sends car feature payload to backend to get predicted price.
   * - formPayload: UI object; converted to backend schema by toBackendPredictPayload
   * - signal: optional AbortSignal
   * Returns parsed JSON in backend's PredictResponse shape.
   */
  const url = `${getBackendBaseUrl()}/predict`;
  const payload = toBackendPredictPayload(formPayload);
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
