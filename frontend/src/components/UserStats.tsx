import React from 'react';
import { User, Shield, Clock, TrendingUp, Users, Activity } from 'lucide-react';
import { UserStats as UserStatsType, GlobalStats } from '../types';

interface UserStatsProps {
  userStats?: UserStatsType;
  globalStats?: GlobalStats;
  userAddress?: string;
}

export const UserStats: React.FC<UserStatsProps> = ({
  userStats,
  globalStats,
  userAddress
}) => {
  const formatTimestamp = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatTimeAgo = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getSuccessRate = (attempts: number, successful: number): number => {
    if (attempts === 0) return 0;
    return Math.round((successful / attempts) * 100);
  };

  return (
    <div className="stats-container">
      <div className="stats-grid">
        {/* User Stats */}
        {userStats && (
          <div className="stats-section">
            <h3>
              <User className="icon" size={20} />
              Your Statistics
            </h3>
            <div className="stats-grid-inner">
              <div className="stat-item">
                <div className="stat-label">Login Attempts</div>
                <div className="stat-value">{userStats.attempts}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Successful Logins</div>
                <div className="stat-value success">{userStats.successful}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Success Rate</div>
                <div className="stat-value">
                  {getSuccessRate(userStats.attempts, userStats.successful)}%
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Last Login Attempt</div>
                <div className="stat-value">
                  {formatTimeAgo(userStats.lastAttempt)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Registration Date</div>
                <div className="stat-value">
                  {formatTimestamp(userStats.registrationTime)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Status</div>
                <div className={`stat-value ${userStats.registered ? 'success' : 'error'}`}>
                  {userStats.registered ? 'Registered' : 'Not Registered'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Stats */}
        {globalStats && (
          <div className="stats-section">
            <h3>
              <Activity className="icon" size={20} />
              Global Statistics
            </h3>
            <div className="stats-grid-inner">
              <div className="stat-item">
                <div className="stat-label">
                  <Users className="icon" size={16} />
                  Total Users
                </div>
                <div className="stat-value">{globalStats.users}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <TrendingUp className="icon" size={16} />
                  Total Attempts
                </div>
                <div className="stat-value">{globalStats.attempts}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <Shield className="icon" size={16} />
                  Successful Logins
                </div>
                <div className="stat-value success">{globalStats.successful}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <Clock className="icon" size={16} />
                  System Status
                </div>
                <div className={`stat-value ${globalStats.paused ? 'error' : 'success'}`}>
                  {globalStats.paused ? 'Paused' : 'Active'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Address */}
        {userAddress && (
          <div className="stats-section">
            <h3>
              <User className="icon" size={20} />
              Account Information
            </h3>
            <div className="address-container">
              <div className="address-label">Wallet Address</div>
              <div className="address-value">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

