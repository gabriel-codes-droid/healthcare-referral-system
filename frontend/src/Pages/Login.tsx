import { Activity, ClipboardPlus, Eye, EyeOff, HeartPulse, Loader2, Lock, Mail, Moon, Plus, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resetPassword } from '../firebase/auth';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-illustration-panel" aria-hidden="true">
        <div className="login-blob login-blob-a" />
        <div className="login-blob login-blob-b" />
        <div className="login-dot-grid" />
        <span className="login-decor-icon icon-heart"><HeartPulse size={26} /></span>
        <span className="login-decor-icon icon-plus-1"><Plus size={22} /></span>
        <span className="login-decor-icon icon-plus-2"><Plus size={26} /></span>
        <span className="login-decor-icon icon-plus-3"><Plus size={18} /></span>
        {/* Reserved for a real illustration file, e.g. src/assets/login-illustration.png:
            <div className="login-character-slot"><img src={illustration} alt="" /></div> */}
        <div className="login-character-slot" />
        <div className="login-corner-clipboard"><ClipboardPlus size={20} /></div>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-mark">
              <Activity size={22} />
            </span>
            <div>
              <h1>Sympra</h1>
              <p>Healthcare Referral System</p>
            </div>
            <button
              type="button"
              className="icon-button"
              style={{ marginLeft: 'auto' }}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {mode === 'signin' ? (
            <>
              <div className="login-welcome login-reveal login-reveal-header">
                <h2>Welcome back!</h2>
                <p>Please sign in to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form login-reveal login-reveal-form">
                <label>
                  Email
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </label>
                <label>
                  Password
                  <div className="input-with-icon password-input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <div className="login-forgot-row">
                  <button type="button" className="forgot-link" onClick={() => setMode('reset')}>
                    Forgot Password?
                  </button>
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn-primary login-submit" disabled={loading}>
                  {loading ? <Loader2 className="spin" size={18} /> : 'Sign In'}
                </button>
              </form>

              <div className="auth-switch login-reveal login-reveal-footer">
                <p>Don't have an account?</p>
                <Link to="/register">Sign up</Link>
              </div>
            </>
          ) : (
            <>
              <div className="login-welcome login-reveal login-reveal-header">
                <h2>Reset your password</h2>
                <p>We'll email you a link to set a new one</p>
              </div>

              {resetSent ? (
                <div className="login-reveal login-reveal-form">
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Check <strong>{resetEmail}</strong> for a link to reset your password.
                  </p>
                  <button type="button" className="forgot-link" style={{ marginTop: '1rem' }} onClick={() => { setMode('signin'); setResetSent(false); setResetEmail(''); }}>
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="login-form login-reveal login-reveal-form">
                  <label>
                    Email
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input type="email" placeholder="Enter your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                    </div>
                  </label>
                  {resetError && <p className="form-error">{resetError}</p>}
                  <button type="submit" className="btn-primary login-submit" disabled={resetLoading}>
                    {resetLoading ? <Loader2 className="spin" size={18} /> : 'Send Reset Link'}
                  </button>
                  <button type="button" className="forgot-link" style={{ alignSelf: 'center' }} onClick={() => setMode('signin')}>
                    Back to Sign In
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

