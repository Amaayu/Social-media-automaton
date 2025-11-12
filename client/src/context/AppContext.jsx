import { createContext, useContext, useState, useEffect } from 'react';
import { automationAPI } from '../utils/api';
import { useToast } from '../hooks/useToast';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [automationStatus, setAutomationStatus] = useState({
    isRunning: false,
    lastCheck: null,
    commentsProcessed: 0,
    errors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Fetch automation status
  const fetchAutomationStatus = async () => {
    // Only fetch if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await automationAPI.getStatus();
      setAutomationStatus(response.data);
    } catch (error) {
      // Silently fail if not authenticated
      if (error.response?.status !== 401) {
        console.error('Error fetching automation status:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchAutomationStatus();
    
    // Poll status every 5 seconds
    const interval = setInterval(fetchAutomationStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    automationStatus,
    isLoading,
    fetchAutomationStatus,
    toast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
