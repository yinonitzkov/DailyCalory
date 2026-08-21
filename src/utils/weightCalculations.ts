import { WeightEntry, UserProfile } from '../types';

export interface BMICalculation {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  categoryLabelHebrew: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  descriptionHebrew: string;
}

export interface WeightProgressMetrics {
  currentWeight: number;
  startingWeight: number;
  targetWeight?: number;
  totalChangeKg: number;
  distanceToTargetKg?: number;
  progressPercent: number; // 0 to 100
  weeklyRateKg: number; // e.g. -0.4 or +0.2
  minWeightKg: number;
  maxWeightKg: number;
  totalEntriesCount: number;
  daysSinceLastWeighIn: number;
  bmi: BMICalculation | null;
}

export interface ChartPoint {
  id: string;
  date: string;
  dateObj: Date;
  label: string;
  weightKg: number;
  movingAverageKg?: number;
  diffFromPrev?: number;
}

export interface WeightMilestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  iconName: string;
}

/**
 * Calculates BMI (Body Mass Index) from weight in kg and height in cm
 */
export function calculateBMI(weightKg: number, heightCm?: number): BMICalculation | null {
  if (!heightCm || heightCm < 50 || weightKg < 20) return null;

  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'underweight',
      categoryLabelHebrew: 'תת-משקל',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      descriptionHebrew: 'מתחת לטווח התקין. כדאי להתייעץ עם תזונאי/ת.',
    };
  } else if (bmi <= 24.9) {
    return {
      bmi,
      category: 'normal',
      categoryLabelHebrew: 'משקל תקין',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      descriptionHebrew: 'טווח בריא ומומלץ (18.5–24.9).',
    };
  } else if (bmi <= 29.9) {
    return {
      bmi,
      category: 'overweight',
      categoryLabelHebrew: 'עודף משקל',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      descriptionHebrew: 'מעל לטווח התקין (25.0–29.9).',
    };
  } else {
    return {
      bmi,
      category: 'obese',
      categoryLabelHebrew: 'השמנה',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      descriptionHebrew: 'מעל 30.0. שמירה על גירעון מתון מומלצת.',
    };
  }
}

/**
 * Calculates comprehensive progress and statistics from weight history
 */
export function calculateWeightProgress(
  entries: WeightEntry[],
  userProfile: UserProfile | null
): WeightProgressMetrics {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const fallbackWeight = userProfile?.currentWeightKg || 70;
  const startingWeight = sorted.length > 0 ? sorted[0].weightKg : fallbackWeight;
  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weightKg : fallbackWeight;
  const targetWeight = userProfile?.targetWeightKg;

  const totalChangeKg = Math.round((currentWeight - startingWeight) * 10) / 10;
  const distanceToTargetKg =
    targetWeight !== undefined ? Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10 : undefined;

  // Calculate percentage of progress towards target weight
  let progressPercent = 0;
  if (targetWeight !== undefined && startingWeight !== targetWeight) {
    const totalGoalDelta = targetWeight - startingWeight;
    const currentDelta = currentWeight - startingWeight;
    const ratio = currentDelta / totalGoalDelta;
    progressPercent = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }

  // Calculate weekly rate of change over the recorded period
  let weeklyRateKg = 0;
  if (sorted.length >= 2) {
    const firstDate = new Date(sorted[0].recordedAt).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].recordedAt).getTime();
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    if (daysDiff >= 3) {
      const weeks = daysDiff / 7;
      weeklyRateKg = Math.round((totalChangeKg / weeks) * 10) / 10;
    }
  }

  const allWeights = sorted.map((e) => e.weightKg);
  const minWeightKg = allWeights.length > 0 ? Math.min(...allWeights) : currentWeight;
  const maxWeightKg = allWeights.length > 0 ? Math.max(...allWeights) : currentWeight;

  let daysSinceLastWeighIn = 0;
  if (sorted.length > 0) {
    const lastTime = new Date(sorted[sorted.length - 1].recordedAt).getTime();
    const now = Date.now();
    daysSinceLastWeighIn = Math.max(0, Math.floor((now - lastTime) / (1000 * 60 * 60 * 24)));
  }

  const bmi = calculateBMI(currentWeight, userProfile?.heightCm);

  return {
    currentWeight,
    startingWeight,
    targetWeight,
    totalChangeKg,
    distanceToTargetKg,
    progressPercent,
    weeklyRateKg,
    minWeightKg,
    maxWeightKg,
    totalEntriesCount: entries.length,
    daysSinceLastWeighIn,
    bmi,
  };
}

/**
 * Prepares chart data points with moving average for selected timeframe
 */
export function prepareWeightChartData(
  entries: WeightEntry[],
  timeframeDays: number | 'all'
): ChartPoint[] {
  if (!entries || entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  let filtered = sorted;
  if (timeframeDays !== 'all') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeframeDays);
    filtered = sorted.filter((e) => new Date(e.recordedAt).getTime() >= cutoff.getTime());
    // If filtering results in too few points, ensure at least the last few are visible
    if (filtered.length === 0) {
      filtered = sorted.slice(-5);
    }
  }

  // Calculate 7-day or 3-entry moving average for smoothing
  const points: ChartPoint[] = filtered.map((entry, index) => {
    const dateObj = new Date(entry.recordedAt);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const label = `${day}/${month}`;

    const prevEntry = index > 0 ? filtered[index - 1] : null;
    const diffFromPrev = prevEntry ? Math.round((entry.weightKg - prevEntry.weightKg) * 10) / 10 : undefined;

    // Moving average window of up to 3 points
    const windowStart = Math.max(0, index - 2);
    const windowEntries = filtered.slice(windowStart, index + 1);
    const sum = windowEntries.reduce((acc, w) => acc + w.weightKg, 0);
    const movingAverageKg = Math.round((sum / windowEntries.length) * 10) / 10;

    return {
      id: entry.id,
      date: entry.recordedAt,
      dateObj,
      label,
      weightKg: entry.weightKg,
      movingAverageKg,
      diffFromPrev,
    };
  });

  return points;
}

/**
 * Calculates milestone achievements
 */
export function calculateWeightMilestones(
  entries: WeightEntry[],
  userProfile: UserProfile | null
): WeightMilestone[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const startingWeight = sorted.length > 0 ? sorted[0].weightKg : (userProfile?.currentWeightKg || 70);
  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weightKg : startingWeight;
  const targetWeight = userProfile?.targetWeightKg;
  const isLosing = targetWeight ? targetWeight < startingWeight : true;
  const totalChange = isLosing ? startingWeight - currentWeight : currentWeight - startingWeight;

  const milestones: WeightMilestone[] = [
    {
      id: 'm-first-log',
      title: 'השקילה הראשונה',
      description: 'הצעד הראשון לשינוי ומעקב אמיתי',
      achieved: entries.length >= 1,
      achievedDate: sorted[0]?.recordedAt,
      iconName: 'Scale',
    },
    {
      id: 'm-consistent-3',
      title: 'עקביות במדידה',
      description: 'לפחות 3 שקילות מתועדות ביומן',
      achieved: entries.length >= 3,
      achievedDate: sorted[2]?.recordedAt,
      iconName: 'Flame',
    },
    {
      id: 'm-1kg',
      title: isLosing ? '1 ק״ג ירידה ראשון' : '1 ק״ג עלייה ראשון',
      description: isLosing ? 'הורדת קילוגרם ראשון בהצלחה!' : 'עלית קילוגרם ראשון במסת שריר!',
      achieved: totalChange >= 1.0,
      iconName: 'Trophy',
    },
    {
      id: 'm-halfway',
      title: 'חצי דרך ליעד',
      description: 'השלמת 50% מהמרחק למשקל היעד שלך',
      achieved: !!targetWeight && startingWeight !== targetWeight && (totalChange / Math.abs(startingWeight - targetWeight)) >= 0.5,
      iconName: 'Target',
    },
    {
      id: 'm-goal-reached',
      title: 'השגת משקל היעד!',
      description: 'הגעת בדיוק למשקל היעד שהגדרת',
      achieved: !!targetWeight && (isLosing ? currentWeight <= targetWeight : currentWeight >= targetWeight),
      iconName: 'Crown',
    },
  ];

  return milestones;
}
