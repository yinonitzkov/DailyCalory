import React, { useState, useRef } from 'react';
import { UserProfile, FoodReport, WeightEntry, UserFoodMemory, WorkoutPlan } from '../../types';
import { useApp } from '../../context/AppContext';
import { AuthModal } from '../auth/AuthModal';
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Check,
  Cloud,
  HardDrive,
  RefreshCw,
  ArrowUpRight,
  Database,
  Info,
  User,
  LogIn,
  LogOut,
  Loader2,
} from 'lucide-react';

interface DataManagementSectionProps {
  userProfile: UserProfile | null;
  foodReports: FoodReport[];
  weightEntries: WeightEntry[];
  foodMemories?: UserFoodMemory[];
  waterEntries?: Record<string, number>;
  workoutPlans?: WorkoutPlan[];
  onResetData: () => void;
  onImportData: (data: {
    userProfile?: UserProfile;
    foodReports?: FoodReport[];
    weightEntries?: WeightEntry[];
    foodMemories?: UserFoodMemory[];
    waterEntries?: Record<string, number>;
    workoutPlans?: WorkoutPlan[];
  }) => boolean;
}

export const DataManagementSection: React.FC<DataManagementSectionProps> = ({
  userProfile,
  foodReports,
  weightEntries,
  foodMemories = [],
  waterEntries = {},
  workoutPlans = [],
  onResetData,
  onImportData,
}) => {
  const {
    storageType,
    isSupabaseAvailable,
    isCloudLoading,
    currentUser,
    switchStorageProvider,
    migrateToSupabase,
    testCloudConnection,
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState<string>('');
  const [isTestingConn, setIsTestingConn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export JSON backup
  const handleExportData = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.3',
        userProfile,
        foodReports,
        weightEntries,
        foodMemories,
        waterEntries,
        workoutPlans,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `calories-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: 'קובץ הגיבוי יוצא והורד בהצלחה למכשירך.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'אירעה שגיאה בעת ייצוא הנתונים.',
      });
    }
  };

  // 2. Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const success = onImportData({
          userProfile: parsed.userProfile,
          foodReports: parsed.foodReports,
          weightEntries: parsed.weightEntries,
          foodMemories: parsed.foodMemories,
          waterEntries: parsed.waterEntries,
          workoutPlans: parsed.workoutPlans,
        });

        if (success) {
          setStatusMessage({
            type: 'success',
            text: 'הנתונים שוחזרו בהצלחה מקובץ הגיבוי!',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'מבנה קובץ הגיבוי אינו תקין.',
          });
        }
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'שגיאה בקריאת קובץ JSON. ודא שזהו קובץ גיבוי תקין של האפליקציה.',
        });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Confirm Reset
  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
    setStatusMessage({
      type: 'success',
      text: 'כל הנתונים אופסו בהצלחה. האפליקציה חזרה להגדרות ברירת מחדל.',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 4. Test Cloud Connection
  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setStatusMessage(null);
    try {
      const result = await testCloudConnection();
      if (result.ok) {
        setStatusMessage({
          type: 'success',
          text: result.message,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `שגיאה בבדיקת החיבור: ${err.message || String(err)}`,
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  // 5. Migrate Local Data to Cloud
  const handleMigrateToCloud = async () => {
    setIsMigrating(true);
    setMigrationStep('מתחיל סנכרון...');
    setStatusMessage(null);

    try {
      const result = await migrateToSupabase((step) => {
        setMigrationStep(step);
      });

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `הסנכרון נכשל: ${err.message || String(err)}`,
      });
    } finally {
      setIsMigrating(false);
      setMigrationStep('');
    }
  };

  return (
    <>
      <section
        id="settings-data-management-section"
        aria-label="ניהול וגיבוי נתונים"
        className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-sm space-y-5 text-slate-100"
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">אחסון, סנכרון וחשבון</h3>
              <p className="text-[11px] text-slate-400">
                שליטה מלאה על מקור האחסון, חשבון משתמש בענן Supabase וגיבוי מלא
              </p>
            </div>
          </div>

          {/* Current storage badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
              storageType === 'supabase'
                ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            {storageType === 'supabase' ? (
              <>
                {isCloudLoading ? (
                  <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />
                ) : (
                  <Cloud className="w-3 h-3 text-sky-400" />
                )}
                <span>ענן Supabase</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-emerald-400" />
                <span>מקומי (Offline)</span>
              </>
            )}
          </div>
        </div>

        {/* User Account Card */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {currentUser ? currentUser.email : 'משתמש אורח (מקומי)'}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser
                  ? 'מחובר ומסונכרן עם ענן Supabase'
                  : 'התחבר כדי לגשת לנתונים מכל מכשיר'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="py-1.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-600/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-98"
          >
            {currentUser ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span>פרטי חשבון</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>התחברות / הרשמה</span>
              </>
            )}
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800'
                : statusMessage.type === 'info'
                ? 'bg-sky-950/60 text-sky-200 border-sky-800'
                : 'bg-rose-950/60 text-rose-200 border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Cloud & Supabase Integration Box */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-slate-200">סנכרון ענן (Supabase Cloud Database)</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              <span>{showConfigHelp ? 'סגור הסבר' : 'הגדרות ענן'}</span>
              <Info className="w-3 h-3" />
            </button>
          </div>

          {showConfigHelp && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-900/40 text-[11px] text-slate-300 space-y-2">
              <p className="font-semibold text-sky-300">חיבור מסד נתונים Supabase:</p>
              <p>
                האפליקציה תומכת בשמירת נתונים ישירה בענן PostgreSQL / Supabase עם ביצועים מהירים, אבטחת RLS ואימות משתמשים.
              </p>
              <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-emerald-400 border border-slate-800 space-y-1">
                <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
              </div>
              <p className="text-[10px] text-slate-400">
                * קובץ הסכמה המלא נמצא ב-<code>src/services/supabase/schema.sql</code> להרצה ב-SQL Editor של Supabase.
              </p>
            </div>
          )}

          <div className="text-xs text-slate-400 leading-relaxed">
            {isSupabaseAvailable ? (
              <span>
                פרטי החיבור ל-Supabase מוגדרים. באפשרותך לבדוק חיבור פעיל, להעלות נתונים מקומיים ישנים או להחליף מנוע אחסון.
              </span>
            ) : (
              <span>
                כרגע האפליקציה פועלת במצב <strong>Offline First</strong> (שמירה בזיכרון הדפדפן). כדי לסנכרן בין מספר מכשירים, הגדר מפתחות Supabase.
              </span>
            )}
          </div>

          {/* Cloud actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConn || isMigrating}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isTestingConn ? 'animate-spin' : ''}`} />
              <span>{isTestingConn ? 'בודק...' : 'בדוק חיבור לענן'}</span>
            </button>

            {isSupabaseAvailable && (
              <>
                <button
                  type="button"
                  onClick={handleMigrateToCloud}
                  disabled={isMigrating || isTestingConn}
                  className="py-2 px-3 bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 border border-sky-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isMigrating ? (migrationStep || 'מסנכרן...') : 'סנכרן נתונים מקומיים לענן'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchStorageProvider(storageType === 'supabase' ? 'local' : 'supabase')}
                  disabled={isMigrating}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all mr-auto"
                >
                  {storageType === 'supabase' ? 'החלף למקומי (Offline)' : 'החלף ל-Supabase'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats of stored items */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">דיווחים ביומן</span>
            <span className="font-extrabold text-slate-100">{foodReports.length}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">שקילות</span>
            <span className="font-extrabold text-slate-100">{weightEntries.length}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">זיכרון מותאם</span>
            <span className="font-extrabold text-emerald-400">{foodMemories.length}</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">סוג אחסון</span>
            <span className={`font-extrabold ${storageType === 'supabase' ? 'text-sky-400' : 'text-emerald-400'}`}>
              {storageType === 'supabase' ? 'Supabase' : 'Local'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportData}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>ייצוא גיבוי JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>ייבוא מגיבוי</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        {/* Reset Data Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 px-3 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-800/50 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>איפוס מלא של נתוני האפליקציה</span>
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div
            id="modal-reset-all-confirm"
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            dir="rtl"
          >
            <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800 space-y-4 animate-in fade-in text-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-100 text-sm">האם לאפס את כל הנתונים?</h4>
                  <p className="text-xs text-slate-400">
                    פעולה זו תמחק את כל היסטוריית הארוחות, השקילות, הזיכרונות וההגדרות מהמכשיר ומהאחסון הפעיל.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-98"
                >
                  כן, אפס הכל
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-98"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Authentication Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
