import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  MapPin, ArrowLeft, Navigation, Check, AlertCircle,
  Loader2, Compass, ExternalLink, RefreshCw, Save, Building2, Map
} from 'lucide-react';
import './OfficeLocationPage.css';

const OfficeLocationPage = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 11.0168,
    longitude: 76.9558,
    accuracy: null,
    updatedAt: null
  });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await makeRequest('/user/location');
      const data = await safeJson(res);
      if (data.success && data.data?.location) {
        const loc = data.data.location;
        setCurrentLocation({
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
          accuracy: loc.accuracy || null,
          updatedAt: loc.updatedAt || loc.capturedAt || null
        });
        setAddress(loc.address || '');
      } else {
        const stored = localStorage.getItem('admin_last_location');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCurrentLocation(parsed);
            setAddress(parsed.address || '');
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not load office location:', err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser environment.');
      return;
    }
    setDetecting(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          updatedAt: new Date().toISOString()
        };
        setCurrentLocation(coords);
        setDetecting(false);
        // Reverse geocoding lookup
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`)
          .then(r => r.json())
          .then(data => {
            if (data?.display_name) setAddress(data.display_name);
          })
          .catch(() => {});
      },
      (err) => {
        setDetecting(false);
        setErrorMsg('Unable to retrieve current coordinates: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      setErrorMsg('Please specify valid latitude and longitude coordinates.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await makeRequest('/user/location', {
        method: 'POST',
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: address.trim(),
          accuracy: currentLocation.accuracy || 10
        })
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setSuccessMsg('Office coordinates successfully updated!');
        localStorage.setItem('admin_last_location', JSON.stringify({
          ...currentLocation,
          address: address.trim()
        }));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to save location coordinates.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving office location.');
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(currentLocation.longitude) - 0.01}%2C${Number(currentLocation.latitude) - 0.01}%2C${Number(currentLocation.longitude) + 0.01}%2C${Number(currentLocation.latitude) + 0.01}&layer=mapnik&marker=${currentLocation.latitude}%2C${currentLocation.longitude}`;
  const externalMapUrl = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;

  return (
    <div className="olp-page">
      {/* ── HEADER ── */}
      <div className="olp-header">
        <div className="olp-header-left">
          <button
            type="button"
            className="olp-back-btn"
            onClick={() => navigate('/admin/admintool')}
            title="Back to Admin Tools"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="olp-title">Headquarters & Branch GPS Location</h1>
            <p className="olp-subtitle">Set verified geographic coordinates for GDK Chit Fund office and customer verification radius</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="olp-detect-btn"
            onClick={detectLocation}
            disabled={detecting}
          >
            <Navigation size={15} className={detecting ? 'spin-anim' : ''} />
            <span>{detecting ? 'Detecting GPS...' : 'Auto-Detect Current GPS'}</span>
          </button>

          <button
            type="button"
            className="olp-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="spin-anim" /> : <Save size={16} />}
            <span>Save Location</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="olp-success-banner">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="olp-error-banner">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── GRID ── */}
      <div className="olp-grid">
        {/* Left: Input Form */}
        <div className="olp-card">
          <h2 className="olp-card-title">Office Coordinate Parameters</h2>

          <form onSubmit={handleSave} className="olp-form">
            <div className="olp-field-row">
              <div className="olp-field">
                <label className="olp-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="olp-input"
                  value={currentLocation.latitude}
                  onChange={e => setCurrentLocation(p => ({ ...p, latitude: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="olp-field">
                <label className="olp-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="olp-input"
                  value={currentLocation.longitude}
                  onChange={e => setCurrentLocation(p => ({ ...p, longitude: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="olp-field">
              <label className="olp-label">Registered Office Street Address</label>
              <textarea
                className="olp-textarea"
                rows="4"
                placeholder="Enter complete office building name, street, taluk, district, and pincode..."
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="olp-meta-box">
              <div className="olp-meta-row">
                <span>Accuracy Radius:</span>
                <strong>{currentLocation.accuracy ? `±${currentLocation.accuracy} meters` : 'High precision (GPS)'}</strong>
              </div>
              <div className="olp-meta-row">
                <span>Last Synchronized:</span>
                <strong>{currentLocation.updatedAt ? new Date(currentLocation.updatedAt).toLocaleString() : 'Manual configuration'}</strong>
              </div>
            </div>

            <a
              href={externalMapUrl}
              target="_blank"
              rel="noreferrer"
              className="olp-external-link"
            >
              <span>Verify Location on Google Maps</span>
              <ExternalLink size={14} />
            </a>
          </form>
        </div>

        {/* Right: Embedded Map Card */}
        <div className="olp-card olp-map-card">
          <div className="olp-map-header">
            <div>
              <h2 className="olp-card-title" style={{ margin: 0 }}>Geographic Positioning Preview</h2>
              <p className="olp-map-desc">Interactive satellite pin for mobile app subscriber radius calculation</p>
            </div>
            <span className="olp-gps-badge">GPS Active</span>
          </div>

          <div className="olp-map-frame-wrap">
            <iframe
              title="Office Map View"
              className="olp-map-iframe"
              src={mapUrl}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeLocationPage;
