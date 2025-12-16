import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchDashboardData = async (force = false) => {
    // Only fetch if we don't have data, it's been more than 5 minutes, or force refresh
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (!force && dashboardData && lastFetched && (now - lastFetched) < fiveMinutes) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setDashboardData(data);
      setLastFetched(now);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData(true);
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const value = {
    dashboardData,
    loading,
    error,
    refreshDashboard,
    lastFetched
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
