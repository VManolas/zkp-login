import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface DebugInfo {
  password: string;
  storedHash: string;
  hashedPassword: string;
  hashesMatch: boolean;
  circuitInput: any;
  publicSignals: string[];
  timestamp: string;
  userAgent: string;
  networkInfo?: any;
  contractInfo?: any;
}

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!debugInfo) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copyAllDebugInfo = async () => {
    const debugText = JSON.stringify(debugInfo, null, 2);
    await copyToClipboard(debugText, 'all');
  };

  const CopyButton: React.FC<{ text: string; field: string; label: string }> = ({ text, field, label }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, field)}
      className="debug-copy-button"
      title={`Copy ${label}`}
    >
      {copiedField === field ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <div className="debug-title">
          <Bug size={16} />
          <span>Debug Information</span>
        </div>
        <div className="debug-actions">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="debug-toggle"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={copyAllDebugInfo}
            className="debug-copy-all"
            title="Copy all debug info"
          >
            <Copy size={14} />
            Copy All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="debug-close"
            title="Close debug panel"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="debug-content">
          <div className="debug-section">
            <h4>Password Verification</h4>
            <div className="debug-field">
              <label>Input Password:</label>
              <div className="debug-value">
                <code>{debugInfo.password}</code>
                <CopyButton text={debugInfo.password} field="password" label="password" />
              </div>
            </div>
            <div className="debug-field">
              <label>Hashed Password:</label>
              <div className="debug-value">
                <code>{debugInfo.hashedPassword}</code>
                <CopyButton text={debugInfo.hashedPassword} field="hashedPassword" label="hashed password" />
              </div>
            </div>
            <div className="debug-field">
              <label>Stored Hash:</label>
              <div className="debug-value">
                <code>{debugInfo.storedHash}</code>
                <CopyButton text={debugInfo.storedHash} field="storedHash" label="stored hash" />
              </div>
            </div>
            <div className="debug-field">
              <label>Hashes Match:</label>
              <div className="debug-value">
                <span className={`debug-status ${debugInfo.hashesMatch ? 'success' : 'error'}`}>
                  {debugInfo.hashesMatch ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>

          <div className="debug-section">
            <h4>Circuit Information</h4>
            <div className="debug-field">
              <label>Circuit Input:</label>
              <div className="debug-value">
                <pre>{JSON.stringify(debugInfo.circuitInput, null, 2)}</pre>
                <CopyButton text={JSON.stringify(debugInfo.circuitInput, null, 2)} field="circuitInput" label="circuit input" />
              </div>
            </div>
            <div className="debug-field">
              <label>Public Signals:</label>
              <div className="debug-value">
                <pre>{JSON.stringify(debugInfo.publicSignals, null, 2)}</pre>
                <CopyButton text={JSON.stringify(debugInfo.publicSignals, null, 2)} field="publicSignals" label="public signals" />
              </div>
            </div>
          </div>

          <div className="debug-section">
            <h4>System Information</h4>
            <div className="debug-field">
              <label>Timestamp:</label>
              <div className="debug-value">
                <code>{debugInfo.timestamp}</code>
              </div>
            </div>
            <div className="debug-field">
              <label>User Agent:</label>
              <div className="debug-value">
                <code>{debugInfo.userAgent}</code>
              </div>
            </div>
          </div>

          {debugInfo.networkInfo && (
            <div className="debug-section">
              <h4>Network Information</h4>
              <div className="debug-value">
                <pre>{JSON.stringify(debugInfo.networkInfo, null, 2)}</pre>
              </div>
            </div>
          )}

          {debugInfo.contractInfo && (
            <div className="debug-section">
              <h4>Contract Information</h4>
              <div className="debug-value">
                <pre>{JSON.stringify(debugInfo.contractInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

