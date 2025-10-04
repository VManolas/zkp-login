import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, HelpCircle, X, Info } from 'lucide-react';

export interface ErrorInfo {
  type: 'password' | 'circuit' | 'network' | 'contract' | 'unknown';
  message: string;
  details?: string;
  canRetry: boolean;
  suggestions?: string[];
  debugInfo?: any;
}

interface ErrorHandlerProps {
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onShowDebug?: () => void;
  showDebug?: boolean;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  onShowDebug,
  showDebug = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'password':
        return <AlertTriangle className="error-icon" size={20} />;
      case 'circuit':
        return <AlertTriangle className="error-icon" size={20} />;
      case 'network':
        return <RefreshCw className="error-icon" size={20} />;
      case 'contract':
        return <AlertTriangle className="error-icon" size={20} />;
      default:
        return <AlertTriangle className="error-icon" size={20} />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'password':
        return 'error-password';
      case 'circuit':
        return 'error-circuit';
      case 'network':
        return 'error-network';
      case 'contract':
        return 'error-contract';
      default:
        return 'error-unknown';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'password':
        return 'Password Verification Failed';
      case 'circuit':
        return 'Circuit Error';
      case 'network':
        return 'Network Error';
      case 'contract':
        return 'Contract Error';
      default:
        return 'Login Error';
    }
  };

  return (
    <div className={`error-handler ${getErrorColor()}`}>
      <div className="error-header">
        <div className="error-icon-container">
          {getErrorIcon()}
        </div>
        <div className="error-content">
          <h3 className="error-title">{getErrorTitle()}</h3>
          <p className="error-message">{error.message}</p>
        </div>
        <div className="error-actions">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="error-dismiss"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error.details && (
        <div className="error-details">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="error-details-toggle"
          >
            <Info size={14} />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          {showDetails && (
            <div className="error-details-content">
              <p>{error.details}</p>
            </div>
          )}
        </div>
      )}

      {error.suggestions && error.suggestions.length > 0 && (
        <div className="error-suggestions">
          <h4>Suggestions:</h4>
          <ul>
            {error.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="error-actions-bottom">
        {error.canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="error-retry-button"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
        
        {onShowDebug && (
          <button
            type="button"
            onClick={onShowDebug}
            className="error-debug-button"
          >
            <HelpCircle size={16} />
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
        )}
      </div>

      {showDebug && error.debugInfo && (
        <div className="error-debug-info">
          <h4>Debug Information:</h4>
          <pre>{JSON.stringify(error.debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Error classification utility
export const classifyError = (error: Error): ErrorInfo => {
  const message = error.message.toLowerCase();
  
  // Password-related errors
  if (message.includes('password') || message.includes('hash') || message.includes('invalid password')) {
    return {
      type: 'password',
      message: 'The password you entered does not match the stored hash.',
      details: 'This could mean you entered the wrong password, or there might be an issue with the password verification process.',
      canRetry: true,
      suggestions: [
        'Double-check your password for typos',
        'Make sure Caps Lock is not enabled',
        'Try typing your password in a text editor first to verify it',
        'If you recently changed your password, make sure you\'re using the new one'
      ]
    };
  }
  
  // Circuit-related errors
  if (message.includes('circuit') || message.includes('template') || message.includes('witness') || message.includes('constraint')) {
    return {
      type: 'circuit',
      message: 'There was an error with the zero-knowledge proof circuit.',
      details: 'This could be due to circuit compilation issues, missing circuit files, or input format problems.',
      canRetry: true,
      suggestions: [
        'Try refreshing the page and logging in again',
        'Check if the circuit files are properly loaded',
        'Ensure your browser supports WebAssembly',
        'Try using a different browser if the issue persists'
      ],
      debugInfo: {
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    };
  }
  
  // Network-related errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      message: 'There was a network connectivity issue.',
      details: 'This could be due to poor internet connection, server issues, or network configuration problems.',
      canRetry: true,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
        'Check if the zkSync network is operational'
      ]
    };
  }
  
  // Contract-related errors
  if (message.includes('contract') || message.includes('transaction') || message.includes('gas')) {
    return {
      type: 'contract',
      message: 'There was an error with the smart contract interaction.',
      details: 'This could be due to contract issues, insufficient gas, or transaction failures.',
      canRetry: true,
      suggestions: [
        'Check if you have sufficient ETH for gas fees',
        'Try increasing the gas limit',
        'Ensure you\'re connected to the correct network',
        'Wait for network congestion to clear'
      ]
    };
  }
  
  // Generic error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred during login.',
    details: error.message,
    canRetry: true,
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Try using a different browser',
      'Contact support if the issue persists'
    ],
    debugInfo: {
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
  };
};
