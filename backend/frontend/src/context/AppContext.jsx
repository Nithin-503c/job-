import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email, role, photoUrl, upiId }
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Restore session on load
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user } = await api.me();
          setUser(user);
        } catch (e) {
          setToken(null);
        }
      }
      setAuthLoading(false);
    })();
  }, []);

  const refreshJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const data = await api.listJobs();
      setJobs(data);
    } catch (e) {
      // board still renders empty; caller can retry
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const loginWithToken = (token, userObj) => {
    setToken(token);
    setUser(userObj);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch) => setUser((u) => (u ? { ...u, ...patch } : u));

  const addJob = async (jobForm) => {
    const created = await api.createJob(jobForm);
    setJobs((prev) => [created, ...prev]);
    return created;
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      loginWithToken,
      logout,
      updateUser,
      jobs,
      jobsLoading,
      refreshJobs,
      addJob,
    }),
    [user, authLoading, jobs, jobsLoading, refreshJobs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
