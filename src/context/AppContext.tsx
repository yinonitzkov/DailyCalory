import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  UserProfile,
  FoodReport,
  WeightEntry,
  DailySummary,
  UserFoodMemory,
  WorkoutPlan,
} from '../types';
import { getLocalDateString, isSameDay } from '../utils/dateUtils';
import {
  getDataRepository,
  getActiveStorageType,
  switchStorageType,
  migrateLocalToCloud,
} from '../services/repository';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  getSupabaseClient,
} from '../services/supabase/client';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithOtp,
  signInWithOAuth,
  signOutUser,
  AuthResult,
} from '../services/auth/authService';
import { DEFAULT_PROFILE } from '../services/repository/LocalStorageAdapter';

interface AppContextType {
  userProfile: UserProfile | null;
  isOnboardingCompleted: boolean;
  foodReports: FoodReport[];
  weightEntries: WeightEntry[];
  foodMemories: UserFoodMemory[];
  waterEntries: Record<string, number>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todaySummary: DailySummary;
  selectedDateSummary: DailySummary;
  selectedDateReports: FoodReport[];
  selectedDateWaterMl: number;
  weeklyHistory: { date: string; dayLabel: string; calories: number; target: number }[];
  latestWeight: { current: number; previous?: number; diff?: number; date?: string };
  // Storage & Cloud features
  storageType: 'local' | 'supabase';
  isSupabaseAvailable: boolean;
  isCloudLoading: boolean;
  cloudSyncError: string | null;
  switchStorageProvider: (type: 'local' | 'supabase') => Promise<void>;
  migrateToSupabase: (onProgress?: (step: string) => void) => Promise<{
    success: boolean;
    message: string;
    count?: { reports: number; weights: number; memories: number; water: number };
  }>;
  testCloudConnection: () => Promise<{ ok: boolean; message: string }>;
  // Step 5: Auth State & Actions
  currentUser: User | null;
  authSession: Session | null;
  isAuthLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  registerWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  loginWithMagicLink: (email: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  // CRUD actions
  completeOnboarding: (data: Omit<UserProfile, 'userId' | 'onboardingCompleted'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addFoodReport: (report: FoodReport) => void;
  updateFoodReport: (report: FoodReport) => void;
  deleteFoodReport: (reportId: string) => void;
  addWeightEntry: (weightKg: number, recordedAt?: string) => void;
  deleteWeightEntry: (id: string) => void;
  addFoodMemory: (memory: { triggerName: string; resolvedDescription: string; notes?: string }) => void;
  updateFoodMemory: (memory: UserFoodMemory) => void;
  deleteFoodMemory: (id: string) => void;
  addWater: (amountMl: number, date?: string) => void;
  setWater: (amountMl: number, date?: string) => void;
  resetUserData: () => void;
  importUserData: (data: {
    userProfile?: UserProfile;
    foodReports?: FoodReport[];
    weightEntries?: WeightEntry[];
    foodMemories?: UserFoodMemory[];
    waterEntries?: Record<string, number>;
    workoutPlans?: WorkoutPlan[];
  }) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storageType, setStorageType] = useState<'local' | 'supabase'>(() => getActiveStorageType());
  const isSupabaseAvailable = useMemo(() => isSupabaseConfigured(), []);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const repository = useMemo(() => getDataRepository(storageType), [storageType]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(new Date()));

  // Initialize state via repository snapshot for fast first paint
  const initialSnapshot = useMemo(() => {
    if ('getInitialSnapshot' in repository && typeof (repository as any).getInitialSnapshot === 'function') {
      return (repository as any).getInitialSnapshot();
    }
    return {
      userProfile: DEFAULT_PROFILE,
      foodReports: [],
      weightEntries: [],
      foodMemories: [],
      waterEntries: { [getLocalDateString(new Date())]: 1250 },
    };
  }, [repository]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => initialSnapshot.userProfile);
  const [foodReports, setFoodReports] = useState<FoodReport[]>(() => initialSnapshot.foodReports);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() => initialSnapshot.weightEntries);
  const [foodMemories, setFoodMemories] = useState<UserFoodMemory[]>(() => initialSnapshot.foodMemories);
  const [waterEntries, setWaterEntries] = useState<Record<string, number>>(() => initialSnapshot.waterEntries);

  // 1. Listen for Supabase Auth State Changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Refresh data from active repository when storage type or active user changes
  const refreshRepositoryData = useCallback(async (activeRepo = repository, uid?: string) => {
    try {
      setIsCloudLoading(true);
      setCloudSyncError(null);

      const [profile, reports, weights, memories, water] = await Promise.all([
        activeRepo.getProfile(uid),
        activeRepo.getReports(uid),
        activeRepo.getWeightEntries(uid),
        activeRepo.getFoodMemories(uid),
        activeRepo.getWaterEntries(uid),
      ]);

      if (profile) setUserProfile(profile);
      setFoodReports(reports || []);
      setWeightEntries(weights || []);
      setFoodMemories(memories || []);
      setWaterEntries(water || {});
    } catch (err: any) {
      console.warn('[AppContext] Refresh data error (switching/fallback):', err);
      setCloudSyncError(err?.message || 'שגיאה בסנכרון נתונים');
    } finally {
      setIsCloudLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    if (storageType === 'supabase') {
      refreshRepositoryData(repository, currentUser?.id);
    }
  }, [storageType, currentUser?.id, repository, refreshRepositoryData]);

  // Switch storage provider dynamically
  const switchStorageProvider = useCallback(async (newType: 'local' | 'supabase') => {
    const repo = switchStorageType(newType);
    setStorageType(newType);
    await refreshRepositoryData(repo, currentUser?.id);
  }, [refreshRepositoryData, currentUser?.id]);

  const migrateToSupabase = useCallback(async (onProgress?: (step: string) => void) => {
    const result = await migrateLocalToCloud(currentUser?.id, onProgress);
    if (result.success) {
      await switchStorageProvider('supabase');
    }
    return result;
  }, [switchStorageProvider, currentUser?.id]);

  const testCloud = useCallback(async () => {
    return testSupabaseConnection();
  }, []);

  // Auth Methods
  const loginWithEmailAction = useCallback(async (email: string, pass: string) => {
    const res = await signInWithEmail(email, pass);
    if (res.success) {
      setStorageType('supabase');
      switchStorageType('supabase');
    }
    return res;
  }, []);

  const registerWithEmailAction = useCallback(async (email: string, pass: string) => {
    const res = await signUpWithEmail(email, pass);
    if (res.success) {
      setStorageType('supabase');
      switchStorageType('supabase');
    }
    return res;
  }, []);

  const loginWithMagicLinkAction = useCallback(async (email: string) => {
    return signInWithOtp(email);
  }, []);

  const loginWithGoogleAction = useCallback(async () => {
    return signInWithOAuth('google');
  }, []);

  const logoutAction = useCallback(async () => {
    await signOutUser();
    setCurrentUser(null);
    setAuthSession(null);
    // Switch back to local data gracefully
    await switchStorageProvider('local');
  }, [switchStorageProvider]);

  // Profile & CRUD Handlers
  const completeOnboarding = (data: Omit<UserProfile, 'userId' | 'onboardingCompleted'>) => {
    const activeUserId = currentUser?.id || userProfile?.userId || 'local-user-1';
    const updated: UserProfile = {
      ...data,
      userId: activeUserId,
      waterTargetMl: data.waterTargetMl || 2500,
      onboardingCompleted: true,
    };
    setUserProfile(updated);
    repository.saveProfile(updated);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      repository.saveProfile(updated);
      return updated;
    });
  };

  const addFoodReport = (report: FoodReport) => {
    const reportWithUser = {
      ...report,
      userId: currentUser?.id || report.userId || 'local-user-1',
    };
    setFoodReports((prev) => [reportWithUser, ...prev]);
    repository.createReport(reportWithUser);
  };

  const updateFoodReport = (report: FoodReport) => {
    setFoodReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
    repository.updateReport(report);
  };

  const deleteFoodReport = (reportId: string) => {
    setFoodReports((prev) => prev.filter((r) => r.id !== reportId));
    repository.deleteReport(reportId);
  };

  const addWeightEntry = (weightKg: number, recordedAt?: string) => {
    const newEntry: WeightEntry = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser?.id || userProfile?.userId || 'local-user-1',
      weightKg,
      recordedAt: recordedAt || new Date().toISOString(),
    };
    setWeightEntries((prev) => [newEntry, ...prev]);
    if (userProfile) {
      const updatedProfile = { ...userProfile, currentWeightKg: weightKg };
      setUserProfile(updatedProfile);
      repository.saveProfile(updatedProfile);
    }
    repository.addWeightEntry(newEntry);
  };

  const deleteWeightEntry = (id: string) => {
    setWeightEntries((prev) => prev.filter((w) => w.id !== id));
    repository.deleteWeightEntry(id);
  };

  const addFoodMemory = (memory: { triggerName: string; resolvedDescription: string; notes?: string }) => {
    const newMemory: UserFoodMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id || 'local-user-1',
      triggerName: memory.triggerName.trim(),
      resolvedDescription: memory.resolvedDescription.trim(),
      notes: memory.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFoodMemories((prev) => [newMemory, ...prev]);
    repository.saveFoodMemory(newMemory);
  };

  const updateFoodMemory = (memory: UserFoodMemory) => {
    const updated = { ...memory, updatedAt: new Date().toISOString() };
    setFoodMemories((prev) => prev.map((m) => (m.id === memory.id ? updated : m)));
    repository.updateFoodMemory(updated);
  };

  const deleteFoodMemory = (id: string) => {
    setFoodMemories((prev) => prev.filter((m) => m.id !== id));
    repository.deleteFoodMemory(id);
  };

  const addWater = (amountMl: number, date?: string) => {
    const targetDate = date || selectedDate;
    const current = waterEntries[targetDate] || 0;
    const next = Math.max(0, current + amountMl);
    setWaterEntries((prev) => ({ ...prev, [targetDate]: next }));
    repository.setWater(targetDate, next, currentUser?.id);
  };

  const setWater = (amountMl: number, date?: string) => {
    const targetDate = date || selectedDate;
    const safeAmount = Math.max(0, amountMl);
    setWaterEntries((prev) => ({ ...prev, [targetDate]: safeAmount }));
    repository.setWater(targetDate, safeAmount, currentUser?.id);
  };

  const resetUserData = () => {
    repository.clearAllData(currentUser?.id);
    setUserProfile(DEFAULT_PROFILE);
    setFoodReports([]);
    setWeightEntries([]);
    setFoodMemories([]);
    setWaterEntries({ [getLocalDateString(new Date())]: 1250 });
  };

  const importUserData = (data: {
    userProfile?: UserProfile;
    foodReports?: FoodReport[];
    weightEntries?: WeightEntry[];
    foodMemories?: UserFoodMemory[];
    waterEntries?: Record<string, number>;
    workoutPlans?: WorkoutPlan[];
  }): boolean => {
    if (!data || typeof data !== 'object') return false;
    try {
      if (data.userProfile) setUserProfile(data.userProfile);
      if (Array.isArray(data.foodReports)) setFoodReports(data.foodReports);
      if (Array.isArray(data.weightEntries)) setWeightEntries(data.weightEntries);
      if (Array.isArray(data.foodMemories)) setFoodMemories(data.foodMemories);
      if (data.waterEntries) setWaterEntries(data.waterEntries);

      repository.importAllData(data);
      return true;
    } catch {
      return false;
    }
  };

  // Summaries Calculations
  const calculateDailySummary = (dateStr: string): DailySummary => {
    const dayReports = foodReports.filter(
      (r) => r.status !== 'deleted' && isSameDay(r.recordedAt, dateStr)
    );

    const totals = dayReports.reduce(
      (acc, r) => ({
        calories: acc.calories + (r.calories || 0),
        protein: acc.protein + (r.proteinG || 0),
        carbs: acc.carbs + (r.carbsG || 0),
        fat: acc.fat + (r.fatG || 0),
        fiber: acc.fiber + (r.fiberG || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return {
      date: dateStr,
      totalCalories: Math.round(totals.calories),
      totalProteinG: Math.round(totals.protein * 10) / 10,
      totalCarbsG: Math.round(totals.carbs * 10) / 10,
      totalFatG: Math.round(totals.fat * 10) / 10,
      totalFiberG: Math.round(totals.fiber * 10) / 10,
      targetCalories: userProfile?.calorieTargetKcal || 2000,
      targetProteinG: userProfile?.proteinTargetG || 120,
      targetCarbsG: userProfile?.carbTargetG || 186,
      targetFatG: userProfile?.fatTargetG || 55,
      targetFiberG: userProfile?.fiberTargetG || 23,
      reportsCount: dayReports.length,
    };
  };

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const todaySummary = useMemo(() => calculateDailySummary(todayStr), [todayStr, foodReports, userProfile]);
  const selectedDateSummary = useMemo(() => calculateDailySummary(selectedDate), [selectedDate, foodReports, userProfile]);

  const selectedDateReports = useMemo(() => {
    return foodReports
      .filter((r) => r.status !== 'deleted' && isSameDay(r.recordedAt, selectedDate))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }, [foodReports, selectedDate]);

  const selectedDateWaterMl = waterEntries[selectedDate] ?? (isSameDay(selectedDate, new Date()) ? 1250 : 0);

  const weeklyHistory = useMemo(() => {
    const days: { date: string; dayLabel: string; calories: number; target: number }[] = [];
    const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayLabel = hebrewDays[d.getDay()];
      const summary = calculateDailySummary(dateStr);

      days.push({
        date: dateStr,
        dayLabel,
        calories: summary.totalCalories,
        target: summary.targetCalories,
      });
    }
    return days;
  }, [foodReports, userProfile]);

  const latestWeight = useMemo(() => {
    const sorted = [...weightEntries].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    const current = sorted[0]?.weightKg || userProfile?.currentWeightKg || 78;
    const previous = sorted[1]?.weightKg;
    const diff = previous !== undefined ? Math.round((current - previous) * 10) / 10 : undefined;

    return {
      current,
      previous,
      diff,
      date: sorted[0]?.recordedAt,
    };
  }, [weightEntries, userProfile]);

  const isOnboardingCompleted = !!userProfile?.onboardingCompleted;

  return (
    <AppContext.Provider
      value={{
        userProfile,
        isOnboardingCompleted,
        foodReports,
        weightEntries,
        foodMemories,
        waterEntries,
        selectedDate,
        setSelectedDate,
        todaySummary,
        selectedDateSummary,
        selectedDateReports,
        selectedDateWaterMl,
        weeklyHistory,
        latestWeight,
        storageType,
        isSupabaseAvailable,
        isCloudLoading,
        cloudSyncError,
        switchStorageProvider,
        migrateToSupabase,
        testCloudConnection: testCloud,
        currentUser,
        authSession,
        isAuthLoading,
        loginWithEmail: loginWithEmailAction,
        registerWithEmail: registerWithEmailAction,
        loginWithMagicLink: loginWithMagicLinkAction,
        loginWithGoogle: loginWithGoogleAction,
        logout: logoutAction,
        completeOnboarding,
        updateProfile,
        addFoodReport,
        updateFoodReport,
        deleteFoodReport,
        addWeightEntry,
        deleteWeightEntry,
        addFoodMemory,
        updateFoodMemory,
        deleteFoodMemory,
        addWater,
        setWater,
        resetUserData,
        importUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
