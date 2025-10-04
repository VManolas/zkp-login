import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CooldownInfo {
  canAttempt: boolean;
  reason: string;
  lastAttempt: number;
  cooldownEnds: number;
  timeRemaining: number;
}

interface CooldownTimerProps {
  cooldownInfo: CooldownInfo | null;
  onCooldownComplete?: () => void;
}

export const CooldownTimer: React.FC<CooldownTimerProps> = ({
  cooldownInfo,
  onCooldownComplete
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!cooldownInfo) {
      setIsActive(false);
      return;
    }

    if (cooldownInfo.canAttempt) {
      setIsActive(false);
      if (onCooldownComplete) {
        onCooldownComplete();
      }
      return;
    }

    if (cooldownInfo.timeRemaining > 0) {
      setTimeRemaining(cooldownInfo.timeRemaining);
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [cooldownInfo, onCooldownComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsActive(false);
            if (onCooldownComplete) {
              onCooldownComplete();
            }
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeRemaining, onCooldownComplete]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getCooldownReason = (reason: string): string => {
    if (reason.includes('cooldown')) {
      return 'Please wait before attempting to login again';
    }
    if (reason.includes('attempts')) {
      return 'Daily login attempts exceeded';
    }
    if (reason.includes('paused')) {
      return 'Contract is currently paused';
    }
    if (reason.includes('registered')) {
      return 'User not registered';
    }
    return reason;
  };

  if (!cooldownInfo || cooldownInfo.canAttempt) {
    return null;
  }

  return (
    <div className="cooldown-timer">
      <div className="cooldown-header">
        <div className="cooldown-icon">
          {cooldownInfo.reason.includes('cooldown') ? (
            <Clock size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
        </div>
        <div className="cooldown-content">
          <h4>Login Restricted</h4>
          <p>{getCooldownReason(cooldownInfo.reason)}</p>
        </div>
      </div>

      {cooldownInfo.reason.includes('cooldown') && timeRemaining > 0 && (
        <div className="cooldown-countdown">
          <div className="countdown-timer">
            <Clock size={16} />
            <span>Try again in: {formatTime(timeRemaining)}</span>
          </div>
          <div className="countdown-bar">
            <div 
              className="countdown-progress"
              style={{ 
                width: `${((60000 - timeRemaining) / 60000) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {cooldownInfo.reason.includes('attempts') && (
        <div className="cooldown-info">
          <p>You have exceeded the daily login attempt limit (10 attempts).</p>
          <p>Please wait 24 hours or contact an admin to reset your attempts.</p>
        </div>
      )}

      {cooldownInfo.reason.includes('paused') && (
        <div className="cooldown-info">
          <p>The contract is currently paused for maintenance.</p>
          <p>Please try again later or contact an admin.</p>
        </div>
      )}

      {cooldownInfo.reason.includes('registered') && (
        <div className="cooldown-info">
          <p>You need to register before you can login.</p>
          <p>Please go to the Register tab to create an account.</p>
        </div>
      )}
    </div>
  );
};
