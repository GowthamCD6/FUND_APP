import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import { 
  User as RiUserLine, Mail as RiMailLine, Phone as RiPhoneLine, 
  Calendar as RiCalendarLine, MapPin as RiMapPinLine, Home as RiHomeLine,
  Lock as RiLockLine, CheckCircle2 as RiCheckCircleLine, ShieldAlert as RiShieldAlertLine,
  UploadCloud as RiUploadLine, HelpCircle as RiHelpLine, Share2 as RiShareLine,
  Star as RiStarLine, ShieldCheck as RiShieldCheckLine, Loader2 as RiLoaderLine,
  Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine,
  RefreshCw as RiRefreshLine, Map as RiMapLine, Eye as RiEyeLine, EyeOff as RiEyeOffLine
} from 'lucide-react';
import './Settings.css';

const SOUTH_INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
];

const TAMIL_NADU_CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore', 
  'Tirunelveli', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 
  'Kanchipuram', 'Nagercoil', 'Kumbakonam', 'Rajapalayam', 'Pudukkottai', 'Hosur', 'Ambur', 
  'Krishnagiri', 'Cuddalore', 'Tiruvannamalai', 'Pollachi', 'Nagapattinam', 'Viluppuram', 
  'Tirupur', 'Ariyalur', 'Perambalur', 'Dharmapuri', 'Virudhunagar', 'Namakkal', 'Tenkasi', 
  'Mayiladuthurai', 'Thiruvarur', 'Udhagamandalam', 'Gudiyatham', 'Panruti', 'Mettur', 
  'Sankarankoil', 'Pattukkottai', 'Ramanathapuram', 'Arakkonam', 'Sirkazhi', 'Palani', 
  'Papanasam', 'Gobichettipalayam', 'Manapparai', 'Paramakudi', 'Tiruchengode', 'Karaikudi', 
  'Kovilpatti', 'Thiruvallur', 'Avadi', 'Tambaram', 'Tiruppur', 'Ambattur', 'Chengalpattu', 
  'Sriperumbudur', 'Others'
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'location' | 'general'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', success: false });

  // ── Profile Form State ──
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    state: '',
    userImage: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // ── Security Lock State ──
  const [lockEnabled, setLockEnabled] = useState(
    localStorage.getItem('webPasscodeEnabled') === 'true'
  );
  const [pinInputs, setPinInputs] = useState(['', '', '', '']);
  const [confirmPinInputs, setConfirmPinInputs] = useState(['', '', '', '']);
  const [showPinSetup, setShowPinSetup] = useState(false);

  // ── Live Geolocation State ──
  const [locLoading, setLocLoading] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing' | 'synced' | 'failed'

  // Fetch admin profile details on component load
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await makeRequest('/auth/profile');
      const data = await safeJson(res);
      if (data.success && data.data) {
        const user = data.data.user || {};
        const profile = data.data.profile || {};
        setProfileForm({
          name: profile.name || user.name || '',
          email: profile.email || user.email || user.mail || '',
          phone: user.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          streetAddress: profile.streetAddress || '',
          city: profile.city || '',
          state: profile.state || '',
          userImage: profile.userImage || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      setMessage({ text: 'Failed to fetch profile info from server.', success: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyLocation();
  }, []);

  // Fetch location data if already stored
  const fetchMyLocation = async () => {
    try {
      const res = await makeRequest('/user/location');
      const data = await safeJson(res);
      if (data.success && data.data?.location) {
        const loc = data.data.location;
        setLiveLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          accuracy: loc.accuracy,
          timestamp: loc.capturedAt || loc.updatedAt,
        });
        setSyncStatus('synced');
      }
    } catch (e) {
      // silent fail
    }
  };

  // Profile fields handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Convert uploaded image to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(prev => ({ ...prev, userImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Profile Form Submissions
  const validateProfile = () => {
    const errors = {};
    if (!profileForm.name.trim()) errors.name = 'Full Name is required';
    if (!profileForm.email.trim()) {
      errors.email = 'Email Address is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!profileForm.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!profileForm.streetAddress.trim()) errors.streetAddress = 'Street Address is required';
    if (!profileForm.state) errors.state = 'State selection is required';
    if (!profileForm.city) errors.city = 'City selection is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSaving(true);
    setMessage({ text: '', success: false });

    try {
      const res = await makeRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          dateOfBirth: profileForm.dateOfBirth,
          streetAddress: profileForm.streetAddress,
          city: profileForm.city,
          state: profileForm.state,
          userImage: profileForm.userImage,
        }),
      });

      const data = await safeJson(res);
      if (res.ok && data.success) {
        setMessage({ text: 'Profile details updated successfully!', success: true });
        // Refresh local session user name if changed
        if (data.data?.user?.name) {
          localStorage.setItem('userName', data.data.user.name);
        }
        // Force refresh local info
        fetchProfile();
      } else {
        setMessage({ text: data.message || 'Failed to save profile details.', success: false });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'A network error occurred. Please try again.', success: false });
    } finally {
      setSaving(false);
    }
  };

  // ── Security Lock Logic ──
  const handleLockToggle = (e) => {
    const checked = e.target.checked;
    if (checked) {
      // Open PIN Setup form
      setPinInputs(['', '', '', '']);
      setConfirmPinInputs(['', '', '', '']);
      setShowPinSetup(true);
    } else {
      if (window.confirm('Are you sure you want to disable the passcode security lock?')) {
        localStorage.removeItem('webPasscodeEnabled');
        localStorage.removeItem('webPasscodePIN');
        setLockEnabled(false);
        alert('Passcode security lock has been disabled.');
      }
    }
  };

  const handlePinInput = (index, value, type) => {
    const val = value.replace(/[^0-9]/g, '').slice(-1);
    const stateSetter = type === 'confirm' ? setConfirmPinInputs : setPinInputs;
    const inputsArray = type === 'confirm' ? confirmPinInputs : pinInputs;

    const nextInputs = [...inputsArray];
    nextInputs[index] = val;
    stateSetter(nextInputs);

    // Auto-focus next field
    if (val && index < 3) {
      const nextField = document.getElementById(`${type}-pin-${index + 1}`);
      if (nextField) nextField.focus();
    }
  };

  const handleKeyDown = (index, e, type) => {
    if (e.key === 'Backspace') {
      const inputsArray = type === 'confirm' ? confirmPinInputs : pinInputs;
      const stateSetter = type === 'confirm' ? setConfirmPinInputs : setPinInputs;

      if (!inputsArray[index] && index > 0) {
        const prevField = document.getElementById(`${type}-pin-${index - 1}`);
        if (prevField) {
          prevField.focus();
          const nextInputs = [...inputsArray];
          nextInputs[index - 1] = '';
          stateSetter(nextInputs);
        }
      }
    }
  };

  const savePin = () => {
    const pin = pinInputs.join('');
    const confirmPin = confirmPinInputs.join('');

    if (pin.length !== 4 || confirmPin.length !== 4) {
      alert('Please fill in both 4-digit PIN fields.');
      return;
    }

    if (pin !== confirmPin) {
      alert('PIN codes do not match. Please re-enter.');
      return;
    }

    // Save
    localStorage.setItem('webPasscodeEnabled', 'true');
    localStorage.setItem('webPasscodePIN', pin);
    sessionStorage.setItem('webSessionUnlocked', 'true');
    setLockEnabled(true);
    setShowPinSetup(false);
    alert('Security Lock PIN set successfully! The screen will lock on page reload or manually.');
  };

  const handleManualLock = () => {
    if (!lockEnabled) {
      alert('Please enable the security lock and configure a PIN first.');
      return;
    }
    sessionStorage.removeItem('webSessionUnlocked');
    // Reload to immediately fire lock overlay
    window.location.reload();
  };

  // ── Geolocation Handling ──
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocLoading(true);
    setSyncStatus('syncing');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const capturedTime = new Date().toISOString();

        // Perform reverse geocoding using openstreetmap nominatim free API
        let resolvedAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const geoData = await res.json();
          if (geoData && geoData.display_name) {
            resolvedAddress = geoData.display_name;
          }
        } catch (e) {
          console.log('Reverse geocoding failed, falling back to coordinates string');
        }

        const newLoc = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: resolvedAddress,
          timestamp: capturedTime,
        };

        setLiveLocation(newLoc);

        // Sync with backend API
        try {
          const res = await makeRequest('/user/save-location', {
            method: 'POST',
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              address: resolvedAddress,
              timestamp: capturedTime,
              savedToDatabase: true,
            }),
          });
          const data = await safeJson(res);
          if (res.ok && data.success) {
            setSyncStatus('synced');
          } else {
            setSyncStatus('failed');
          }
        } catch (err) {
          console.error(err);
          setSyncStatus('failed');
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        setLocLoading(false);
        setSyncStatus('failed');
        console.error('Location detection error:', error);
        alert(`Failed to get location: ${error.message}. Please check browser permissions.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // General rate & share trigger
  const handleCopyShareLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`Check out the GDK Chit Fund Panel: ${url}`);
    alert('Share link copied to clipboard!');
  };

  const handleRate = () => {
    alert('Thank you for rating our application! Feedback saved.');
  };

  return (
    <div className="set-page">

      {/* Main layout */}
      <div className="set-layout">
        
        {/* LEFT COLUMN: Sidebar Navigation */}
        <div className="set-nav-panel">
          <div className="set-admin-card">
            <div className="set-admin-avatar-wrap">
              {profileForm.userImage ? (
                <img src={profileForm.userImage} alt="avatar" className="set-admin-avatar-img" />
              ) : (
                <div className="set-admin-avatar">
                  {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>
            <h4 className="set-admin-name">{profileForm.name || 'GDK Admin'}</h4>
            <span className="set-admin-role">Super Admin</span>
            <p className="set-admin-phone">
              <RiPhoneLine size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {profileForm.phone || 'Phone number'}
            </p>
            <p className="set-admin-phone" style={{ marginTop: 4 }}>
              <RiMailLine size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {profileForm.email || 'Email address'}
            </p>
          </div>

          <div className="set-menu-list">
            <button 
              className={`set-menu-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab('profile'); setMessage({ text: '', success: false }); }}
            >
              <RiUserLine size={16} /> Edit Profile Details
            </button>
            <button 
              className={`set-menu-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setMessage({ text: '', success: false }); }}
            >
              <RiLockLine size={16} /> Web Passcode Lock
            </button>
            <button 
              className={`set-menu-btn ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => { setActiveTab('location'); setMessage({ text: '', success: false }); }}
            >
              <RiMapPinLine size={16} /> GPS Location Tracking
            </button>
            <button 
              className={`set-menu-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => { setActiveTab('general'); setMessage({ text: '', success: false }); }}
            >
              <RiHelpLine size={16} /> General Info & Support
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Tab Panel */}
        <div className="set-content-panel">
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 350 }}>
              <RiLoaderLine size={36} className="spin-anim" color="#6b46c1" />
              <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading configurations...</p>
            </div>
          ) : (
            <>
              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="set-section-hd">
                    <h3 className="set-section-title">Edit Profile Information</h3>
                    <p className="set-section-desc">Keep your details correct so members can identify you</p>
                  </div>

                  <form className="set-form" onSubmit={handleProfileSave}>
                    
                    {/* User profile image uploader */}
                    <div className="set-image-editor">
                      <div className="set-image-circle-wrap" onClick={() => document.getElementById('profile-image-upload').click()}>
                        {profileForm.userImage ? (
                          <img src={profileForm.userImage} alt="profile" className="set-image-preview" />
                        ) : (
                          <div className="set-image-placeholder">
                            <RiUserLine size={40} />
                          </div>
                        )}
                        <div className="set-image-overlay">
                          <RiInstagramLine size={24} />
                        </div>
                      </div>
                      <div className="set-image-info">
                        <label className="set-upload-label" htmlFor="profile-image-upload">
                          <RiUploadLine size={16} /> Upload New Photo
                        </label>
                        <input 
                          id="profile-image-upload"
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleImageUpload} 
                        />
                        <span className="set-image-hint">JPEG or PNG, Max 2MB.</span>
                      </div>
                    </div>

                    <div className="set-form-row">
                      <div className="set-form-group">
                        <label className="set-label"><RiUserLine size={14} /> Full Name <span className="set-label-req">*</span></label>
                        <input 
                          type="text" 
                          name="name"
                          value={profileForm.name} 
                          onChange={handleInputChange} 
                          className={`set-input ${formErrors.name ? 'error' : ''}`}
                          placeholder="e.g. Gowtham"
                        />
                        {formErrors.name && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.name}</p>}
                      </div>

                      <div className="set-form-group">
                        <label className="set-label"><RiMailLine size={14} /> Email Address <span className="set-label-req">*</span></label>
                        <input 
                          type="email" 
                          name="email"
                          value={profileForm.email} 
                          onChange={handleInputChange} 
                          className={`set-input ${formErrors.email ? 'error' : ''}`}
                          placeholder="e.g. gowtham@gmail.com"
                        />
                        {formErrors.email && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.email}</p>}
                      </div>
                    </div>

                    <div className="set-form-row">
                      <div className="set-form-group">
                        <label className="set-label"><RiPhoneLine size={14} /> Phone Number <span style={{ color: '#6b7280', fontSize: 11 }}>(read-only)</span></label>
                        <input 
                          type="text" 
                          value={profileForm.phone} 
                          disabled 
                          className="set-input"
                          style={{ background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                        />
                      </div>

                      <div className="set-form-group">
                        <label className="set-label"><RiCalendarLine size={14} /> Date of Birth <span className="set-label-req">*</span></label>
                        <input 
                          type="date" 
                          name="dateOfBirth"
                          value={profileForm.dateOfBirth} 
                          onChange={handleInputChange} 
                          className={`set-input ${formErrors.dateOfBirth ? 'error' : ''}`}
                        />
                        {formErrors.dateOfBirth && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.dateOfBirth}</p>}
                      </div>
                    </div>

                    <div className="set-form-group">
                      <label className="set-label"><RiHomeLine size={14} /> Street Address <span className="set-label-req">*</span></label>
                      <textarea 
                        name="streetAddress"
                        value={profileForm.streetAddress} 
                        onChange={handleInputChange} 
                        rows={3}
                        className={`set-textarea ${formErrors.streetAddress ? 'error' : ''}`}
                        placeholder="Enter house no, street name, locality..."
                      />
                      {formErrors.streetAddress && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.streetAddress}</p>}
                    </div>

                    <div className="set-form-row">
                      <div className="set-form-group">
                        <label className="set-label"><RiMapPinLine size={14} /> State <span className="set-label-req">*</span></label>
                        <select 
                          name="state" 
                          value={profileForm.state} 
                          onChange={handleInputChange} 
                          className={`set-select ${formErrors.state ? 'error' : ''}`}
                        >
                          <option value="">Select State</option>
                          {SOUTH_INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {formErrors.state && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.state}</p>}
                      </div>

                      <div className="set-form-group">
                        <label className="set-label"><RiMapPinLine size={14} /> City <span className="set-label-req">*</span></label>
                        {profileForm.state === 'Tamil Nadu' ? (
                          <select 
                            name="city" 
                            value={profileForm.city} 
                            onChange={handleInputChange} 
                            className={`set-select ${formErrors.city ? 'error' : ''}`}
                          >
                            <option value="">Select City</option>
                            {TAMIL_NADU_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            name="city" 
                            value={profileForm.city} 
                            onChange={handleInputChange} 
                            className={`set-input ${formErrors.city ? 'error' : ''}`} 
                            placeholder="Enter City name"
                          />
                        )}
                        {formErrors.city && <p className="set-error-msg"><RiShieldAlertLine size={12} /> {formErrors.city}</p>}
                      </div>
                    </div>

                    {message.text && (
                      <div className={`message-alert ${message.success ? 'success' : 'error'}`}>
                        {message.success ? <RiCheckCircleLine size={18} /> : <RiShieldAlertLine size={18} />}
                        {message.text}
                      </div>
                    )}

                    <div className="set-btn-row">
                      <button 
                        type="submit" 
                        className="set-btn-primary" 
                        disabled={saving}
                      >
                        {saving ? <RiLoaderLine size={16} className="spin-anim" /> : <RiCheckCircleLine size={16} />}
                        {saving ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Security Lock Tab */}
              {activeTab === 'security' && (
                <div>
                  <div className="set-section-hd">
                    <h3 className="set-section-title">Web Session Lock Settings</h3>
                    <p className="set-section-desc">Protect your administrator session with an access passcode lock screen</p>
                  </div>

                  <div className="set-lock-card">
                    <div className="set-lock-row">
                      <div className="set-lock-info">
                        <div className={`set-lock-icon-wrap ${lockEnabled ? 'enabled' : 'disabled'}`}>
                          <RiLockLine size={22} />
                        </div>
                        <div>
                          <h4 className="set-lock-title">App Passcode Lock Screen</h4>
                          <p className="set-lock-desc">
                            When enabled, reloading the page or clicking "Lock Screen" will block access and prompt for your 4-digit PIN.
                          </p>
                        </div>
                      </div>
                      <label className="set-switch">
                        <input 
                          type="checkbox" 
                          checked={lockEnabled} 
                          onChange={handleLockToggle} 
                        />
                        <span className="set-slider"></span>
                      </label>
                    </div>

                    {/* Manual Lock button if enabled */}
                    {lockEnabled && !showPinSetup && (
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Lock your browser dashboard immediately</span>
                        <button className="set-btn-primary" onClick={handleManualLock} style={{ background: '#ef4444' }}>
                          <RiLockLine size={15} /> Lock Screen Now
                        </button>
                      </div>
                    )}

                    {/* PIN setup fields */}
                    {showPinSetup && (
                      <div className="set-pin-section">
                        {/* ENTER PIN */}
                        <div className="set-pin-input-group">
                          <span className="set-pin-input-label">Enter new 4-digit PIN:</span>
                          <div className="set-pin-boxes">
                            {pinInputs.map((val, idx) => (
                              <input 
                                key={`enter-${idx}`}
                                id={`enter-pin-${idx}`}
                                type="password" 
                                maxLength={1}
                                value={val}
                                onChange={(e) => handlePinInput(idx, e.target.value, 'enter')}
                                onKeyDown={(e) => handleKeyDown(idx, e, 'enter')}
                                className="set-pin-box"
                              />
                            ))}
                          </div>
                        </div>

                        {/* CONFIRM PIN */}
                        <div className="set-pin-input-group">
                          <span className="set-pin-input-label">Confirm 4-digit PIN:</span>
                          <div className="set-pin-boxes">
                            {confirmPinInputs.map((val, idx) => (
                              <input 
                                key={`confirm-${idx}`}
                                id={`confirm-pin-${idx}`}
                                type="password" 
                                maxLength={1}
                                value={val}
                                onChange={(e) => handlePinInput(idx, e.target.value, 'confirm')}
                                onKeyDown={(e) => handleKeyDown(idx, e, 'confirm')}
                                className="set-pin-box"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="set-pin-actions">
                          <button 
                            className="set-btn-cancel" 
                            type="button"
                            onClick={() => { setShowPinSetup(false); setLockEnabled(false); }}
                          >
                            Cancel
                          </button>
                          <button 
                            className="set-btn-primary" 
                            type="button"
                            onClick={savePin}
                          >
                            <RiShieldCheckLine size={18} /> Save Passcode PIN
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="set-security-help-card">
                    <RiShieldCheckLine size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Security Note:</strong> Passcode locks are kept local to this specific web browser environment. If you clear browser cache or use a private window, you will need to re-configure the passcode. PIN inputs are masked for privacy.
                    </div>
                  </div>
                </div>
              )}

              {/* GPS Location Tracking Tab */}
              {activeTab === 'location' && (
                <div>
                  <div className="set-section-hd">
                    <h3 className="set-section-title">My Location Settings</h3>
                    <p className="set-section-desc">Record your current coordinates and sync them as the admin's central position</p>
                  </div>

                  <div className="set-loc-card">
                    <div className="set-loc-icon-large">
                      <RiMapPinLine size={32} />
                    </div>
                    <h4 className="set-loc-title-main">Share Admin Office Location</h4>
                    <p className="set-loc-desc-main">
                      Detects your browser's physical coordinates to help local users and other team members locate your central office position.
                    </p>

                    <button 
                      className="set-loc-btn" 
                      onClick={handleDetectLocation}
                      disabled={locLoading}
                    >
                      {locLoading ? <RiLoaderLine size={18} className="spin-anim" /> : <RiRefreshLine size={18} />}
                      {locLoading ? 'Capturing GPS...' : 'Detect & Update My Location'}
                    </button>

                    {syncStatus === 'synced' && (
                      <span className="set-loc-sync-badge">
                        <RiCheckCircleLine size={16} /> Saved & Synced with Database
                      </span>
                    )}
                    {syncStatus === 'failed' && (
                      <span className="set-loc-sync-badge error">
                        <RiShieldAlertLine size={16} /> Sync Failed. Try again.
                      </span>
                    )}

                    {liveLocation && (
                      <div className="set-loc-results">
                        <div className="set-loc-result-row">
                          <RiMapPinLine size={20} className="set-loc-result-icon" />
                          <div className="set-loc-result-content">
                            <div className="set-loc-result-label">Detected Address</div>
                            <div className="set-loc-result-value">{liveLocation.address}</div>
                          </div>
                        </div>

                        <div className="set-loc-grid">
                          <div className="set-loc-result-row">
                            <RiMapLine size={20} className="set-loc-result-icon" />
                            <div className="set-loc-result-content">
                              <div className="set-loc-result-label">Coordinates</div>
                              <div className="set-loc-result-value">
                                {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                              </div>
                            </div>
                          </div>

                          <div className="set-loc-result-row">
                            <RiRefreshLine size={20} className="set-loc-result-icon" />
                            <div className="set-loc-result-content">
                              <div className="set-loc-result-label">Accuracy / Time</div>
                              <div className="set-loc-result-value">
                                ±{liveLocation.accuracy}m at {new Date(liveLocation.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="set-loc-action-bar">
                          <a 
                            href={`https://maps.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="set-loc-action-btn maps"
                          >
                            Open in Google Maps
                          </a>
                          <button className="set-loc-action-btn share" onClick={handleCopyShareLink}>
                            Share Coordinates
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* General Info & Support Tab */}
              {activeTab === 'general' && (
                <div>
                  <div className="set-section-hd">
                    <h3 className="set-section-title">General Info & Support</h3>
                    <p className="set-section-desc">Application details, ratings, and support avenues</p>
                  </div>

                  <div className="set-general-grid">
                    
                    {/* Rate & Share */}
                    <div className="set-info-card">
                      <h4 className="set-info-card-title"><RiStarLine size={16} /> Rate & Share App</h4>
                      <p className="set-info-card-text">
                        Love using the GDK Chit Fund Management App? Give us a rating and share the app with your colleagues.
                      </p>
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button className="set-social-btn" onClick={handleRate} title="Rate App"><RiStarLine size={18} /></button>
                        <button className="set-social-btn" onClick={handleCopyShareLink} title="Share App"><RiShareLine size={18} /></button>
                      </div>
                    </div>

                    {/* Socials */}
                    <div className="set-info-card">
                      <h4 className="set-info-card-title"><RiInstagramLine size={16} /> Stay Connected</h4>
                      <p className="set-info-card-text">
                        Follow our social media channels to stay updated with release announcements, tutorials, and tips.
                      </p>
                      <div className="set-social-links">
                        <button className="set-social-btn"><RiInstagramLine size={18} /></button>
                        <button className="set-social-btn"><RiYoutubeLine size={18} /></button>
                        <button className="set-social-btn"><RiWhatsappLine size={18} /></button>
                      </div>
                    </div>

                    {/* Support Channels */}
                    <div className="set-info-card" style={{ gridColumn: '1 / -1' }}>
                      <h4 className="set-info-card-title"><RiHelpLine size={16} /> Help & Customer Support</h4>
                      <p className="set-info-card-text" style={{ marginBottom: 12 }}>
                        If you experience database syncing issues, password lockouts, or billing discrepancies, please reach out via our support channels.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <a href="tel:+918610696889" className="set-support-action">
                          Call Support: <span>+91-8610696889</span>
                        </a>
                        <a href="mailto:Gowthamnaveen124@gmail.com" className="set-support-action">
                          Mail Us: <span>Gowthamnaveen124@gmail.com</span>
                        </a>
                      </div>
                    </div>

                  </div>

                  <div className="set-version-tag">
                    Web App Version: 3.1.4 (Vite React Build)
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default Settings;
