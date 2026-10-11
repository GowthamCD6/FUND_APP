import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { MapPin, X, Building2, Phone, ExternalLink, Navigation, Compass, RefreshCw, Check, Copy } from 'lucide-react';
import './ProfileModals.css';

const DEFAULT_OFFICES = [
  {
    id: 1,
    name: 'GDK Chit Funds - Tiruppur Main Headquarters',
    location: 'Kumaran Road, Tiruppur, Tamil Nadu 641601',
    address: 'No. 45/A, Kumaran Road, Near Railway Station, Tiruppur - 641601, Tamil Nadu',
    phone: '+91 98422 12345',
    latitude: 11.1085,
    longitude: 77.3411,
    timing: 'Mon - Sat: 9:00 AM - 6:30 PM',
    isHQ: true,
  },
  {
    id: 2,
    name: 'GDK Chit Funds - Coimbatore Regional Branch',
    location: 'Avinashi Road, Peelamedu, Coimbatore 641004',
    address: 'SF No. 112, Avinashi Road, Peelamedu, Coimbatore - 641004, Tamil Nadu',
    phone: '+91 98422 67890',
    latitude: 11.0268,
    longitude: 77.0028,
    timing: 'Mon - Sat: 9:30 AM - 6:00 PM',
    isHQ: false,
  }
];

const AdminLocationModal = ({ isOpen, onClose }) => {
  const [locations, setLocations] = useState(DEFAULT_OFFICES);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchAdminLocations();
  }, [isOpen]);

  const fetchAdminLocations = async () => {
    setLoading(true);
    try {
      const res = await makeRequest('/user/admins/locations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setLocations(data.data);
      }
    } catch (err) {
      console.warn('Using default office locations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (loc) => {
    navigator.clipboard.writeText(`${loc.name}\n${loc.address}\nPhone: ${loc.phone || 'N/A'}`);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openMap = (lat, lng, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="prof-modal-backdrop" onClick={onClose}>
      <div className="prof-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="prof-modal-header">
          <div className="prof-modal-title-group">
            <div className="prof-modal-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="prof-modal-title">Registered Branch Locations</h2>
              <p className="prof-modal-subtitle">Official GDK Chit Fund headquarters and branch offices</p>
            </div>
          </div>
          <button className="prof-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="prof-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              Authorized Locations ({locations.length})
            </span>
            <button
              onClick={fetchAdminLocations}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 4
              }}
            >
              <RefreshCw size={13} className={loading ? 'prof-spinner' : ''} />
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {locations.map((loc) => {
              const lat = Number(loc.latitude) || 11.1085;
              const lng = Number(loc.longitude) || 77.3411;
              return (
                <div
                  key={loc.id}
                  style={{
                    border: loc.isHQ ? '1.5px solid #c7d2fe' : '1px solid #e2e8f0',
                    background: loc.isHQ ? '#f8faff' : '#ffffff',
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                          {loc.name}
                        </h4>
                        {loc.isHQ && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#2563eb',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            letterSpacing: '0.04em'
                          }}>
                            HEADQUARTERS
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                        {loc.address || loc.location}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, fontSize: 12, color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={13} color="#2563eb" />
                      <a href={`tel:${loc.phone || '+919842212345'}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                        {loc.phone || '+91 98422 12345'}
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Compass size={13} color="#64748b" />
                      <span>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
                    </div>
                    {loc.timing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>•</span>
                        <span>{loc.timing}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    <button
                      onClick={() => openMap(lat, lng, loc.name)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Navigation size={13} />
                      Open Google Maps
                    </button>
                    <button
                      onClick={() => handleCopy(loc)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        padding: '8px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === loc.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      {copiedId === loc.id ? 'Copied' : 'Copy Info'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="prof-modal-footer">
          <button className="prof-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLocationModal;
