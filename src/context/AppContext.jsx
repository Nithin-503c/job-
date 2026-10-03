import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

const SEED_JOBS = [
  {
    id: 'j1',
    title: 'Weekend Babysitter Needed',
    category: 'Babysitting',
    location: 'Indiranagar, Bengaluru',
    duration: '1 day (6 hrs)',
    pay: 900,
    postedBy: 'Anita R.',
    description: 'Looking for someone reliable to look after 2 kids (ages 5 & 8) on Saturday afternoon while we attend a family event.',
    rating: 4.8,
  },
  {
    id: 'j2',
    title: 'Garden Cleanup & Lawn Mowing',
    category: 'Gardening',
    location: 'Koramangala, Bengaluru',
    duration: 'Half day',
    pay: 650,
    postedBy: 'Suresh K.',
    description: 'Need help clearing overgrown bushes and mowing a small front lawn. Tools will be provided.',
    rating: 4.5,
  },
  {
    id: 'j3',
    title: 'Event Setup Assistant',
    category: 'Event Help',
    location: 'HSR Layout, Bengaluru',
    duration: '4 hrs',
    pay: 1200,
    postedBy: 'Meera D.',
    description: 'Need 2 people to help set up chairs, decorations, and sound equipment for a birthday event.',
    rating: 4.9,
  },
  {
    id: 'j4',
    title: 'Same-Day Delivery Run',
    category: 'Delivery',
    location: 'Whitefield, Bengaluru',
    duration: '3 hrs',
    pay: 500,
    postedBy: 'Rohit P.',
    description: 'Pick up packages from a warehouse and deliver to 4 addresses nearby. Own two-wheeler required.',
    rating: 4.3,
  },
  {
    id: 'j5',
    title: 'Deep Cleaning Domestic Help',
    category: 'Domestic Help',
    location: 'Jayanagar, Bengaluru',
    duration: '1 day',
    pay: 800,
    postedBy: 'Kavya S.',
    description: 'Full apartment deep clean before guests arrive — kitchen, bathrooms, and living area.',
    rating: 4.7,
  },
];

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); // { name, email, role }
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [payments, setPayments] = useState([]); // completed payment records

  const login = (email, role) => {
    setUser({ name: email.split('@')[0], email, role });
  };
  const logout = () => setUser(null);

  const addJob = (job) => {
    setJobs((prev) => [{ ...job, id: 'j' + (prev.length + 1) + '-' + Date.now(), postedBy: user?.name || 'You', rating: null }, ...prev]);
  };

  const recordPayment = (record) => {
    setPayments((prev) => [record, ...prev]);
  };

  const value = useMemo(
    () => ({ user, login, logout, jobs, addJob, payments, recordPayment }),
    [user, jobs, payments]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
