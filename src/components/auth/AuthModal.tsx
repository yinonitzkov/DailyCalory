import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    isAuthLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithMagicLink,
    loginWithGoogle,
    logout,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'magic-link'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'ההתחברות נכשלה');
        } else {
          setSuccessMsg('התחברת בהצלחה!');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else if (mode === 'register') {
        const res = await registerWithEmail(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'ההרשמה נכשלה');
        } else {
          setSuccessMsg('חשבונך נוצר בהצלחה! התחברת למערכת.');
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else if (mode === 'magic-link') {
        const res = await loginWithMagicLink(email);
        if (!res.success) {
          setErrorMsg(res.error || 'שליחת הקישור נכשלה');
        } else {
          setSuccessMsg('קישור התחברות נשלח לתיבת המייל שלך! בדוק את הדואר הנכנס.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'אירעה שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'התחברות עם Google נכשלה');
      } else {
        setSuccessMsg('התחברת בהצלחה עם Google!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'שגיאת התחברות עם Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      onClose();
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-auth-dialog"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-base">
                {currentUser ? 'החשבון שלי' : mode === 'login' ? 'התחברות לחשבון' : mode === 'register' ? 'יצירת חשבון חדש' : 'התחברות ללא סיסמה'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser
                  ? 'סנכרון ענן Neon מאובטח'
                  : 'שמור וסנכרן את יומן התזונה שלך בין כל המכשירים'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">אימייל מחובר:</span>
                <span className="font-bold text-slate-100 font-mono text-[11px]">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">מזהה משתמש (UID):</span>
                <span className="font-mono text-slate-400 text-[10px] truncate max-w-[180px]">
                  {currentUser.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">סטטוס סנכרון:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ענן Neon פעיל ומאובטח</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 px-4 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>התנתק מהחשבון</span>
            </button>
          </div>
        ) : (
          /* Form for Login / Register / Magic-link */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-xl font-bold transition-all ${
                  mode === 'login' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                התחברות
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-xl font-bold transition-all ${
                  mode === 'register' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                הרשמה
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('magic-link');
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-xl font-bold transition-all ${
                  mode === 'magic-link' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Magic Link
              </button>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">כתובת אימייל</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all text-left"
                />
              </div>
            </div>

            {/* Password Field (Only for Login / Register) */}
            {mode !== 'magic-link' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 block">סיסמה</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    dir="ltr"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all text-left"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isAuthLoading}
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : mode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>
                {mode === 'login'
                  ? 'התחבר עכשיו'
                  : mode === 'register'
                  ? 'צור חשבון והתחל לסנכרן'
                  : 'שלח קישור התחברות במייל'}
              </span>
            </button>

            {/* Google OAuth Option */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>התחבר עם חשבון Google</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
