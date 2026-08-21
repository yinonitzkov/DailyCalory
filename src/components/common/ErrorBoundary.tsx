import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  declare state: Readonly<State>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    if (window.confirm('האם לאפס את הנתונים המקומיים כדי לפתור את הבעיה?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          id="app-error-boundary"
          className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">
                אירעה שגיאה בלתי צפויה
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                האפליקציה נתקלה בבעיה בעיבוד הנתונים. תוכל לרענן את העמוד או לאפס את הזיכרון המקומי.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-mono text-slate-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>רענן את האפליקציה</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>איפוס מלא של נתונים פגומים</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
