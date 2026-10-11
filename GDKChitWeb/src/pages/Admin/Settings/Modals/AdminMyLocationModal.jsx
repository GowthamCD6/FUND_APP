import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  MapPin,
  X,
  Navigation,
  Check,
  AlertCircle,
  Loader2,
  Compass,
  ExternalLink
} from 'lucide-react';
import './AdminModals.css';

const AdminMyLocationModal = ({ isOpen, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchLocation();
  }, [isOpen]);

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
      console.warn('Could not load admin location:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg('');
    setSuccessMsg('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newLoc = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          updatedAt: new Date().toISOString()
        };
        setCurrentLocation(newLoc);

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.display_name) {
              setAddress(geoData.display_name);
              newLoc.address = geoData.display_name;
            }
          }
        } catch (e) {
          if (!address) {
            setAddress(`${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`);
          }
        }

        setDetecting(false);
        setSuccessMsg('Coordinates detected! Click "Save Coordinates" to update.');
      },
      (err) => {
        setDetecting(false);
        setErrorMsg('Failed to detect location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      setErrorMsg('Please detect your current location first.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        address: address.trim() || `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
      };

      const res = await makeRequest('/user/save-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await safeJson(res);

      if (data.success) {
        localStorage.setItem('admin_last_location', JSON.stringify({ ...currentLocation, address }));
        setSuccessMsg('Admin headquarters location securely updated!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to save location.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error saving location.');
    } finally {
      setSaving(false);
    }
  };

  const openMap = () => {
    if (!currentLocation) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#ecfeff', color: '#0891b2' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Admin Physical Location</h2>
              <p className="adm-modal-subtitle">Register administrator headquarters coordinates for subscribers</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          {errorMsg && (
            <div className="adm-alert adm-alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="adm-alert adm-alert-success">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={24} className="adm-spinner" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Loading location...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {currentLocation ? (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Compass size={16} color="#0891b2" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        Active Office GPS
                      </span>
                    </div>
                    {currentLocation.accuracy && (
                      <span style={{ fontSize: 11, color: '#0891b2', background: '#cffafe', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        ±{currentLocation.accuracy}m accuracy
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Latitude</span>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>{currentLocation.latitude.toFixed(6)}°</strong>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Longitude</span>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>{currentLocation.longitude.toFixed(6)}°</strong>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Headquarters / Office Address</label>
                    <textarea
                      className="adm-form-input"
                      style={{ height: 60, resize: 'vertical' }}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Kumaran Road, Tiruppur"
                    />
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={openMap}
                      type="button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      <ExternalLink size={13} />
                      View on Google Maps
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 24,
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 10
                }}>
                  <MapPin size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ margin: 0, fontSize: 14, color: '#334155' }}>No Location Linked</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Click detect to acquire your browser coordinates.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleDetect}
                  disabled={detecting}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid #0891b2',
                    background: '#ecfeff',
                    color: '#0891b2',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  {detecting ? <Loader2 size={15} className="adm-spinner" /> : <Navigation size={15} />}
                  {detecting ? 'Detecting GPS...' : 'Detect Browser Location'}
                </button>

                {currentLocation && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="adm-btn-primary"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {saving ? <Loader2 size={15} className="adm-spinner" /> : <Check size={15} />}
                    {saving ? 'Saving...' : 'Save Coordinates'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMyLocationModal;
