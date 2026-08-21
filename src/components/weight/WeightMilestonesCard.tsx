import React from 'react';
import { WeightMilestone } from '../../utils/weightCalculations';
import { Award, Trophy, Target, Flame, Scale, CheckCircle2, Lock } from 'lucide-react';
import { formatDateShortHebrew } from '../../utils/dateUtils';

interface WeightMilestonesCardProps {
  milestones: WeightMilestone[];
}

export const WeightMilestonesCard: React.FC<WeightMilestonesCardProps> = ({ milestones }) => {
  const getIcon = (iconName: string, isAchieved: boolean) => {
    const className = `w-4 h-4 ${isAchieved ? 'text-amber-600' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Scale':
        return <Scale className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Crown':
      default:
        return <Award className={className} />;
    }
  };

  const achievedCount = milestones.filter((m) => m.achieved).length;

  return (
    <section
      id="weight-milestones-card"
      aria-label="הישגים ואבני דרך במשקל"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">אבני דרך והישגים</h3>
            <p className="text-[11px] text-slate-500">
              {achievedCount} מתוך {milestones.length} הישגים הושלמו
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
          {Math.round((achievedCount / milestones.length) * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
              milestone.achieved
                ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                : 'bg-slate-50/60 border-slate-100 opacity-65'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  milestone.achieved ? 'bg-amber-100' : 'bg-slate-200/60'
                }`}
              >
                {getIcon(milestone.iconName, milestone.achieved)}
              </div>
              <div>
                <h4
                  className={`text-xs font-bold ${
                    milestone.achieved ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {milestone.title}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {milestone.description}
                </p>
              </div>
            </div>

            {milestone.achieved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
