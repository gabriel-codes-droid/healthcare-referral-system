import { useState } from 'react';
import { User, Lock, LogOut, Camera, Mail, Shield, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

type PasswordResetStep = 'request' | 'verify' | 'reset' | 'success';

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileModal, setProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  
  // Profile editing state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password reset state
  const [resetStep, setResetStep] = useState<PasswordResetStep>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfileModal(false);
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
      // Simulate sending email with verification code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedCode(code);
      // In production, this would call an email API to send the code to the user's email
      // For demo purposes, we'll show the code in the UI
      alert(`DEMO: Your verification code is: ${code}\n\nIn production, this would be sent to your email.`);
      setResetStep('verify');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    
    try {
      if (verificationCode !== generatedCode) {
        throw new Error('Invalid verification code');
      }
      setResetStep('reset');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetStep('success');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setPasswordModal(false);
        setResetStep('request');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedCode('');
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to reset password');
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
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`}
                    alt={user?.name}
                  />
                  <button type="button" className="avatar-edit-btn">
                    <Camera size={16} />
                  </button>
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
              <p>Change your password securely with email verification</p>
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
          setVerificationCode('');
          setNewPassword('');
          setConfirmPassword('');
          setGeneratedCode('');
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
              A verification code will be sent to your email address
            </p>
            {passwordError && <p className="form-error full-width">{passwordError}</p>}
            <button type="submit" className="btn-primary full-width" disabled={passwordSaving}>
              {passwordSaving ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {resetStep === 'verify' && (
          <form className="form-grid" onSubmit={handleCodeVerification}>
            <label className="full-width">
              Verification Code *
              <input
                name="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </label>
            <p className="form-hint full-width">
              Enter the code sent to {resetEmail}
            </p>
            {passwordError && <p className="form-error full-width">{passwordError}</p>}
            <button type="submit" className="btn-primary full-width" disabled={passwordSaving}>
              {passwordSaving ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="btn-secondary full-width"
              onClick={() => setResetStep('request')}
            >
              Back
            </button>
          </form>
        )}

        {resetStep === 'reset' && (
          <form className="form-grid" onSubmit={handlePasswordReset}>
            <label className="full-width">
              New Password *
              <input
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </label>
            <label className="full-width">
              Confirm Password *
              <input
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </label>
            {passwordError && <p className="form-error full-width">{passwordError}</p>}
            <button type="submit" className="btn-primary full-width" disabled={passwordSaving}>
              {passwordSaving ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              className="btn-secondary full-width"
              onClick={() => setResetStep('request')}
            >
              Cancel
            </button>
          </form>
        )}

        {resetStep === 'success' && (
          <div className="success-message">
            <Check size={48} />
            <h3>Password Reset Successful</h3>
            <p>Your password has been changed successfully</p>
          </div>
        )}
      </Modal>
    </>
  );
}
