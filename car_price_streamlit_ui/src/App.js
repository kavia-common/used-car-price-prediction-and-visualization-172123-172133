import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { getMetrics, predictPrice, getBackendBaseUrl, getHealth } from './api';

// Helper components
function MetricBar({ label, value, maxValue, color, tooltip }) {
  const width = Math.max(0, Math.min(100, (value / maxValue) * 100));
  return (
    <div className="metric-item" title={tooltip || `${label}: ${value}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-bar-outer">
        <div className="metric-bar-inner" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <div className="metric-value">{typeof value === 'number' ? value.toFixed(3) : value}</div>
    </div>
  );
}

function MetricsChart({ metrics }) {
  if (!metrics) return null;
  // Normalize bars: r2 in [0,1], mae/rmse inversed by simple scaling for visual parity
  const r2 = metrics.r2 ?? 0;
  const mae = metrics.mae ?? 0;
  const rmse = metrics.rmse ?? 0;

  // Determine scale for MAE/RMSE to fit 0-1 range relative to the largest error metric
  const errorMax = Math.max(mae, rmse, 1);
  const maeScaled = errorMax ? (1 - (mae / errorMax)) : 0;
  const rmseScaled = errorMax ? (1 - (rmse / errorMax)) : 0;

  return (
    <div className="metrics-card">
      <div className="card-header">
        <h3>Model Performance</h3>
        <p className="subtle">Higher is better for R²; lower is better for errors (MAE, RMSE).</p>
      </div>
      <div className="metric-list">
        <MetricBar label="R²" value={r2} maxValue={1} color="var(--primary)" tooltip="Coefficient of Determination" />
        <MetricBar label="MAE" value={maeScaled} maxValue={1} color="var(--secondary)" tooltip={`Mean Absolute Error: ${mae.toFixed ? mae.toFixed(2) : mae}`} />
        <MetricBar label="RMSE" value={rmseScaled} maxValue={1} color="var(--secondary)" tooltip={`Root Mean Squared Error: ${rmse.toFixed ? rmse.toFixed(2) : rmse}`} />
      </div>
    </div>
  );
}

const initialForm = {
  year: '',
  mileage: '',
  brand: '',
  model: '',
  fuel_type: '',
  transmission: '',
  owner_count: '',
  engine_size: '',
  seats: ''
};

// PUBLIC_INTERFACE
function App() {
  /** Main app with sidebar form, metrics display, and SVG bar charts. */
  const [theme, setTheme] = useState('light');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictErr, setPredictErr] = useState('');
  const [metricsData, setMetricsData] = useState(null);
  const [metricsErr, setMetricsErr] = useState('');
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [health, setHealth] = useState(null);
  const [healthErr, setHealthErr] = useState('');

  const backendUrl = useMemo(() => getBackendBaseUrl(), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoadingMetrics(true);
      setMetricsErr('');
      setHealthErr('');
      try {
        // Health first to reflect basic readiness
        const h = await getHealth(controller.signal);
        setHealth(h);
      } catch (e) {
        setHealthErr(e.message);
      }
      try {
        const data = await getMetrics(controller.signal);
        setMetricsData(data);
      } catch (e) {
        setMetricsErr(e.message);
      } finally {
        setLoadingMetrics(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    const num = (v) => (v === '' || v === null) ? NaN : Number(v);
    // Backend allows 1950..(currentYear+1)
    const currentYearMax = new Date().getFullYear() + 1;
    if (!Number.isInteger(Number(form.year)) || Number(form.year) < 1950 || Number(form.year) > currentYearMax) e.year = `Year must be between 1950 and ${currentYearMax}`;
    if (!Number.isFinite(num(form.mileage)) || Number(form.mileage) < 0) e.mileage = 'Mileage must be a non-negative number';
    if (!form.brand) e.brand = 'Brand is required';
    if (!form.model) e.model = 'Model is required';
    if (!form.fuel_type) e.fuel_type = 'Fuel type is required';
    if (!form.transmission) e.transmission = 'Transmission is required';
    if (!Number.isInteger(Number(form.owner_count)) || Number(form.owner_count) < 0 || Number(form.owner_count) > 10) e.owner_count = 'Owner count must be between 0 and 10';
    // Backend expects engine_cc >= 100; UI captures liters, so require >= 0.1 L
    if (!Number.isFinite(num(form.engine_size)) || Number(form.engine_size) < 0.1) e.engine_size = 'Engine size must be at least 0.1 L';
    if (!Number.isInteger(Number(form.seats)) || Number(form.seats) < 1 || Number(form.seats) > 20) e.seats = 'Seats must be between 1 and 20';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setPrediction(null);
    setPredictErr('');

    if (!validate()) return;

    setIsPredicting(true);
    try {
      const uiPayload = {
        year: Number(form.year),
        mileage: Number(form.mileage),
        brand: form.brand,
        model: form.model,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        owner_count: Number(form.owner_count),
        engine_size: Number(form.engine_size),
        seats: Number(form.seats)
      };
      const res = await predictPrice(uiPayload);
      // Backend returns { predicted_price, inputs, model_info }
      const price = res && typeof res.predicted_price !== 'undefined' ? res.predicted_price : null;
      setPrediction(price);
    } catch (e) {
      setPredictErr(e.message);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand-row">
          <h1 className="app-title">Used Car Price</h1>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="env-info">Backend: <span className="env-url" title={backendUrl}>{backendUrl}</span></div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label>Year</label>
            <input type="number" value={form.year} onChange={(e) => updateField('year', e.target.value)} placeholder="2017" />
            {errors.year && <div className="error">{errors.year}</div>}
          </div>
          <div className="form-row">
            <label>Mileage</label>
            <input type="number" value={form.mileage} onChange={(e) => updateField('mileage', e.target.value)} placeholder="45000" />
            {errors.mileage && <div className="error">{errors.mileage}</div>}
          </div>
          <div className="form-row">
            <label>Brand</label>
            <input type="text" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="Toyota" />
            {errors.brand && <div className="error">{errors.brand}</div>}
          </div>
          <div className="form-row">
            <label>Model</label>
            <input type="text" value={form.model} onChange={(e) => updateField('model', e.target.value)} placeholder="Corolla" />
            {errors.model && <div className="error">{errors.model}</div>}
          </div>
          <div className="form-row">
            <label>Fuel Type</label>
            <select value={form.fuel_type} onChange={(e) => updateField('fuel_type', e.target.value)}>
              <option value="">Select</option>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Hybrid</option>
              <option>Electric</option>
            </select>
            {errors.fuel_type && <div className="error">{errors.fuel_type}</div>}
          </div>
          <div className="form-row">
            <label>Transmission</label>
            <select value={form.transmission} onChange={(e) => updateField('transmission', e.target.value)}>
              <option value="">Select</option>
              <option>Manual</option>
              <option>Automatic</option>
            </select>
            {errors.transmission && <div className="error">{errors.transmission}</div>}
          </div>
          <div className="form-row">
            <label>Owner Count</label>
            <input type="number" value={form.owner_count} onChange={(e) => updateField('owner_count', e.target.value)} placeholder="1" />
            {errors.owner_count && <div className="error">{errors.owner_count}</div>}
          </div>
          <div className="form-row">
            <label>Engine Size (L)</label>
            <input type="number" step="0.1" value={form.engine_size} onChange={(e) => updateField('engine_size', e.target.value)} placeholder="1.6" />
            {errors.engine_size && <div className="error">{errors.engine_size}</div>}
          </div>
          <div className="form-row">
            <label>Seats</label>
            <input type="number" value={form.seats} onChange={(e) => updateField('seats', e.target.value)} placeholder="5" />
            {errors.seats && <div className="error">{errors.seats}</div>}
          </div>

          <button className="btn-primary" type="submit" disabled={isPredicting}>
            {isPredicting ? 'Predicting…' : 'Predict Price'}
          </button>

          {predictErr && <div className="alert error">Error: {predictErr}</div>}
          {prediction !== null && !predictErr && (
            <div className="prediction-card">
              <div className="prediction-title">Predicted Price</div>
              <div className="prediction-value">${Number(prediction).toLocaleString()}</div>
            </div>
          )}
        </form>
      </aside>

      <main className="main">
        <div className="hero">
          <h2 className="section-title">Model Overview</h2>
          {loadingMetrics && <div className="skeleton">Loading metrics…</div>}
          {metricsErr && <div className="alert error">Failed to load metrics: {metricsErr}</div>}
          {!loadingMetrics && !metricsErr && metricsData && (
            <>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className={`badge ${metricsData.ready ? 'success' : 'warn'}`}>{metricsData.ready ? 'Ready' : 'Not Ready'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Model</div>
                  <div className="info-value">{metricsData.model_type || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Trained At</div>
                  <div className="info-value">{metricsData.trained_at ? new Date(metricsData.trained_at * (metricsData.trained_at < 10_000_000_000 ? 1000 : 1)).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
              {healthErr && <div className="alert error">Health: {healthErr}</div>}
              {health && !healthErr && <div className="badge success">Health OK</div>}
              <MetricsChart metrics={metricsData.metrics || {}} />
              <div className="features-card">
                <div className="card-header">
                  <h3>Features</h3>
                  <p className="subtle">Input fields used by the model.</p>
                </div>
                <div className="pill-row">
                  {(metricsData.features || []).map((f) => (
                    <span key={f} className="pill">{f}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
