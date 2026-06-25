import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name || undefined);
      // AuthProvider will update state; redirect handled by the router
    } catch {
      // error already set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError ?? error;

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="logo-mark">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366F1" />
              <path d="M9 10h9M9 16h14M9 22h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="10" r="3" fill="#A5B4FC" />
            </svg>
          </div>
          <h1>Create your account</h1>
          <p>Start turning documents into conversations.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {displayError && (
            <div className="error-banner" role="alert">
              {displayError}
            </div>
          )}

          <div className="field">
            <label htmlFor="name">Name <span className="optional">(optional)</span></label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner" aria-hidden="true" />
            ) : null}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="signin-link">
          Already have an account?{' '}
          <a href="/login">Sign in</a>
        </p>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f13;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        .register-card {
          width: 100%;
          max-width: 400px;
          background: #18181f;
          border: 1px solid #2a2a35;
          border-radius: 16px;
          padding: 40px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-mark {
          display: inline-flex;
          margin-bottom: 20px;
        }

        .register-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #f0f0f5;
          margin: 0 0 8px;
          letter-spacing: -0.3px;
        }

        .register-header p {
          font-size: 14px;
          color: #7b7b8f;
          margin: 0;
        }

        .error-banner {
          background: #2d1a1a;
          border: 1px solid #5c2626;
          color: #f87171;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .field {
          margin-bottom: 18px;
        }

        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #c0c0cc;
          margin-bottom: 6px;
        }

        .optional {
          font-weight: 400;
          color: #5a5a6e;
        }

        .field input {
          width: 100%;
          background: #0f0f13;
          border: 1px solid #2a2a35;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 14px;
          color: #f0f0f5;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .field input::placeholder {
          color: #3e3e50;
        }

        .field input:focus {
          border-color: #6366F1;
        }

        .submit-btn {
          width: 100%;
          background: #6366F1;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 11px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, opacity 0.15s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #4f52d9;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .signin-link {
          text-align: center;
          margin: 24px 0 0;
          font-size: 13px;
          color: #7b7b8f;
        }

        .signin-link a {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .signin-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}