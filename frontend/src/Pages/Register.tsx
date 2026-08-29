import { Activity, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Register() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('clinic');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, role, organization);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/login" className="back-link">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="login-brand">
          <span className="brand-mark">
            <Activity size={22} />
          </span>
          <div>
            <h1>Join Sympra</h1>
            <p>Create your healthcare account</p>
          </div>
        </div>

        <div className="healthcare-header">
          <h2>Sign Up</h2>
          <p>Register your healthcare organization</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Dr. John Doe"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="doctor@clinic.com"
            />
          </label>
          <label>
            Password
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
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
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="clinic">Clinic Doctor</option>
              <option value="hospital">Hospital</option>
              <option value="lab">Laboratory</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Organization
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
              placeholder="City Clinic"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : 'Create Account'}
          </button>
        </form>

        <label className="mode-toggle login-toggle">
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        </label>
      </div>
    </div>
  );
}
