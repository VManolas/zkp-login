import React, { useState } from 'react';
import { Eye, EyeOff, Lock, UserPlus, Shield, CheckCircle } from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (password: string) => Promise<void>;
  loading: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  loading
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStrengthColor = (strength: number): string => {
    if (strength < 25) return '#ff4444';
    if (strength < 50) return '#ff8800';
    if (strength < 75) return '#ffaa00';
    return '#00aa00';
  };

  const getStrengthText = (strength: number): string => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form" autoComplete="on">
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
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Enter a strong password"
            className="password-input"
            disabled={loading}
            autoComplete="new-password"
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
          Enter a strong password for your account
        </div>
        
        {password && (
          <div className="password-strength">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${passwordStrength}%`,
                  backgroundColor: getStrengthColor(passwordStrength)
                }}
              />
            </div>
            <span className="strength-text" style={{ color: getStrengthColor(passwordStrength) }}>
              {getStrengthText(passwordStrength)}
            </span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          <Lock className="icon" size={16} />
          Confirm Password
        </label>
        <div className="password-input-container">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="password-input"
            disabled={loading}
            autoComplete="new-password"
            aria-describedby="confirm-password-help"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="password-toggle"
            disabled={loading}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div id="confirm-password-help" className="sr-only">
          Confirm your password to ensure it matches
        </div>
      </div>

      {password && confirmPassword && password === confirmPassword && passwordStrength >= 50 && (
        <div className="success-message">
          <CheckCircle className="icon" size={16} />
          Passwords match and meet strength requirements
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
        disabled={loading || !password || !confirmPassword || password !== confirmPassword || passwordStrength < 50}
        className="submit-button"
      >
        {loading ? (
          <>
            <div className="spinner" />
            Registering...
          </>
        ) : (
          <>
            <UserPlus className="icon" size={16} />
            Register
          </>
        )}
      </button>

      <div className="password-requirements">
        <h4>Password Requirements:</h4>
        <ul>
          <li className={password.length >= 8 ? 'met' : ''}>
            At least 8 characters long
          </li>
          <li className={password.length >= 12 ? 'met' : ''}>
            At least 12 characters for better security
          </li>
          <li className={/[A-Z]/.test(password) ? 'met' : ''}>
            Contains uppercase letters
          </li>
          <li className={/[0-9]/.test(password) ? 'met' : ''}>
            Contains numbers
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? 'met' : ''}>
            Contains special characters
          </li>
        </ul>
      </div>
    </form>
  );
};

