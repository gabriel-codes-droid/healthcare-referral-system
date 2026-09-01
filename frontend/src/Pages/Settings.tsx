import React, { useRef, useState } from 'react';
import { User, Lock, LogOut, Camera, Mail, Shield, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Modal from '../components/Modal';

type PasswordResetStep = 'request' | 'success';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileModal, setProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Profile editing state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password reset state
  const [resetStep, setResetStep] = useState<PasswordResetStep>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 150 * 1024) {
        alert('File size must be less than 150KB when Firebase Storage is disabled');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('File must be an image');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    
    try {
      const updateData: { name?: string; email?: string; avatar?: string } = {
        name: profileName,
        email: profileEmail
      };
      
      if (avatarPreview) {
        updateData.avatar = avatarPreview;
      }
      
      await api.updateProfile(updateData);
      await refreshUser();
      setProfileModal(false);
      setAvatarPreview(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    try {
      await api.resetPassword(resetEmail);
      setResetStep('success');
      setTimeout(() => {
        setPasswordModal(false);
        setResetStep('request');
        setResetEmail('');
      }, 2500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to send password reset email');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profile
          </button>
          <button
            type="button"
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            Security
          </button>
        </div>

        {activeTab === 'profile' && (
          <section className="settings-section">
            <div className="profile-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                  <img
                    src={avatarPreview || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`}
                    alt={user?.name}
                  />
                  <button 
                    type="button" 
                    className="avatar-edit-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="profile-info">
                  <h2>{user?.name}</h2>
                  <p>{user?.role === 'admin' ? 'Super Admin' : (user?.organization || 'General')}</p>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-item">
                  <Mail size={18} />
                  <div>
                    <label>Email</label>
                    <span>{user?.email || 'Not set'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Shield size={18} />
                  <div>
                    <label>Role</label>
                    <span>{user?.role || 'User'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setProfileModal(true)}
              >
                Edit Profile
              </button>
            </div>

            <div className="logout-section">
              <button
                type="button"
                className="btn-danger"
                onClick={logout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </section>
        )}

        {activeTab === 'security' && (
          <section className="settings-section">
            <div className="security-card">
              <div className="security-header">
                <Lock size={24} />
                <h2>Password & Security</h2>
              </div>
              <p>Change your password securely with a Firebase reset link</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </section>
        )}
      </div>

      <Modal title="Edit Profile" open={profileModal} onClose={() => setProfileModal(false)}>
        <form className="form-grid" onSubmit={handleProfileUpdate}>
          <label className="full-width">
            Full Name *
            <input
              name="name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
            />
          </label>
          <label className="full-width">
            Email *
            <input
              name="email"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              required
            />
          </label>
          {profileError && <p className="form-error full-width">{profileError}</p>}
          <button type="submit" className="btn-primary full-width" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      <Modal
        title="Change Password"
        open={passwordModal}
        onClose={() => {
          setPasswordModal(false);
          setResetStep('request');
          setResetEmail('');
          setPasswordError('');
        }}
      >
        {resetStep === 'request' && (
          <form className="form-grid" onSubmit={handlePasswordResetRequest}>
            <label className="full-width">
              Email Address *
              <input
                name="email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </label>
            <p className="form-hint full-width">
              Firebase will send a secure, time-limited password reset link to this address.
            </p>
            {passwordError && <p className="form-error full-width">{passwordError}</p>}
            <button type="submit" className="btn-primary full-width" disabled={passwordSaving}>
              {passwordSaving ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}


        {resetStep === 'success' && (
          <div className="success-message">
            <Check size={48} />
            <h3>Reset Link Sent</h3>
            <p>Check your email and follow the Firebase reset link to choose a new password.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
