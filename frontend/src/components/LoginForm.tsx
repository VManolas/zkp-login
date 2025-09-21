import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, Clock } from 'lucide-react';
import { LoginAttemptResult } from '../types';

interface LoginFormProps {
  onSubmit: (password: string) => Promise<LoginAttemptResult>;
  loading: boolean;
  canAttemptLogin?: boolean;
  loginReason?: string;
  retryAfter?: number;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading,
  canAttemptLogin = true,
  loginReason,
  retryAfter
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (!canAttemptLogin) {
      setError(loginReason || 'Cannot attempt login at this time');
      return;
    }

    try {
      const result = await onSubmit(password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatRetryTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  return (
    <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
      {/* Hidden username field for accessibility */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="form-group">
        <label htmlFor="password" className="form-label">
          <Lock className="icon" size={16} />
          Password
        </label>
        <div className="password-input-container">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="password-input"
            disabled={loading || !canAttemptLogin}
            autoComplete="current-password"
            aria-describedby="password-help"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            disabled={loading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div id="password-help" className="sr-only">
          Enter your password to login with zero-knowledge proof
        </div>
      </div>

      {!canAttemptLogin && (
        <div className="warning-message">
          <Clock className="icon" size={16} />
          <span>
            {loginReason}
            {retryAfter && retryAfter > 0 && (
              <span className="retry-time">
                Retry in {formatRetryTime(retryAfter)}
              </span>
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <Shield className="icon" size={16} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canAttemptLogin || !password.trim()}
        className="submit-button"
      >
        {loading ? (
          <>
            <div className="spinner" />
            Logging in...
          </>
        ) : (
          <>
            <User className="icon" size={16} />
            Login
          </>
        )}
      </button>
    </form>
  );
};

