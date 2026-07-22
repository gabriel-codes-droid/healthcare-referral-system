import { Activity, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const demoAccounts = [
  { role: 'Admin', email: 'admin@sympra.com', password: 'admin123' },
  { role: 'Clinic Doctor', email: 'clinic@sympra.com', password: 'clinic123' },
  { role: 'Hospital', email: 'hospital@sympra.com', password: 'hospital123' },
  { role: 'Laboratory', email: 'lab@sympra.com', password: 'lab123' }
];

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@sympra.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const quickLogin = async (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setError('');
    setLoading(true);
    try {
      await login(accountEmail, accountPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">
            <Activity size={22} />
          </span>
          <div>
            <h1>Sympra</h1>
            <p>Healthcare Referral System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <p>Quick login as:</p>
          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-btn"
                onClick={() => quickLogin(account.email, account.password)}
                disabled={loading}
              >
                {account.role}
              </button>
            ))}
          </div>
        </div>

        <label className="mode-toggle login-toggle">
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        </label>
      </div>
    </div>
  );
}
