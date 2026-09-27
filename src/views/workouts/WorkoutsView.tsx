import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Clock3, Dumbbell, Play, Plus, Sparkles, Trash2, Video, X } from 'lucide-react';
import { Exercise, WorkoutFocus, WorkoutPlan, WorkoutPlanDay, WorkoutPlanItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { getDataRepository } from '../../services/repository';
import { EXERCISES, EQUIPMENT_LABELS, FOCUS_LABELS, MUSCLE_LABELS, DIFFICULTY_LABELS, MOVEMENT_LABELS } from '../../services/workouts/catalog';
import { estimateWorkoutMinutes, generateWorkoutPlan } from '../../services/workouts/generator';
import { WorkoutPlayer } from './WorkoutPlayer';

type Screen = 'plan' | 'library';
const FOCUSES: WorkoutFocus[] = ['core', 'legs', 'cardio', 'full_body'];
const uid = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const WorkoutsView: React.FC = () => {
  const { currentUser, userProfile, storageType } = useApp();
  const userId = currentUser?.id || userProfile?.userId || 'local-user-1';
  const repository = useMemo(() => getDataRepository(storageType), [storageType]);
  const [screen, setScreen] = useState<Screen>('plan');
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [activeDayId, setActiveDayId] = useState('');
  const [playerExercise, setPlayerExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ muscle: '', equipment: '', difficulty: '', movement: '' });
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [durationMinMinutes, setDurationMinMinutes] = useState(30);
  const [durationMaxMinutes, setDurationMaxMinutes] = useState(45);
  const [focuses, setFocuses] = useState<WorkoutFocus[]>(['full_body']);
  const [playerDayIndex, setPlayerDayIndex] = useState<number | null>(null);
  const [playerItemIndex, setPlayerItemIndex] = useState<number | null>(null);
  const [setNumber, setSetNumber] = useState(1);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    repository.getWorkoutPlans(userId).then((loaded) => {
      setPlans(loaded);
      setActivePlan(loaded[0] || null);
      setActiveDayId(loaded[0]?.days[0]?.id || '');
    }).catch((e) => setError(e?.message || 'טעינת התוכניות נכשלה')).finally(() => setLoading(false));
  }, [repository, userId]);

  useEffect(() => {
    if (restLeft === null || restLeft <= 0) return;
    const timer = window.setTimeout(() => setRestLeft((current) => current === null ? null : Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [restLeft]);

  const muscleOptions = useMemo(() => [...new Set(EXERCISES.flatMap((exercise) => exercise.primaryMuscles))].sort(), []);
  const equipmentOptions = useMemo(() => [...new Set(EXERCISES.flatMap((exercise) => exercise.equipment))].sort(), []);
  const movementOptions = useMemo(() => [...new Set(EXERCISES.map((exercise) => exercise.movementPattern))].sort(), []);
  const filteredExercises = useMemo(() => EXERCISES.filter((exercise) =>
    (!filters.muscle || exercise.primaryMuscles.includes(filters.muscle)) &&
    (!filters.equipment || exercise.equipment.includes(filters.equipment)) &&
    (!filters.difficulty || exercise.difficulty === filters.difficulty) &&
    (!filters.movement || exercise.movementPattern === filters.movement)
  ), [filters]);
  const activeDay = activePlan?.days.find((day) => day.id === activeDayId) || activePlan?.days[0] || null;
  const cardioCount = EXERCISES.filter((exercise) => exercise.movementPattern === 'conditioning').length;

  const persistPlan = async (plan: WorkoutPlan) => {
    if (saveTimeoutRef.current !== null) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    setActivePlan(updated);
    setPlans((previous) => [updated, ...previous.filter((item) => item.id !== updated.id)]);
    saveChainRef.current = saveChainRef.current.then(async () => {
      try { await repository.saveWorkoutPlan(updated); setError(''); }
      catch (e: any) { setError(`השמירה נכשלה: ${e?.message || 'בדוק את חיבור Supabase והפעל את ה־migration'}`); }
    });
    await saveChainRef.current;
  };
  const generate = async () => {
    const plan = generateWorkoutPlan({ userId, daysPerWeek, durationWeeks, focuses, durationMinMinutes, durationMaxMinutes });
    setActivePlan(plan); setActiveDayId(plan.days[0]?.id || '');
    await persistPlan(plan);
  };
  const updateDay = (day: WorkoutPlanDay, updater: (items: WorkoutPlanItem[]) => WorkoutPlanItem[]) => {
    if (!activePlan) return;
    const next = { ...activePlan, days: activePlan.days.map((item) => item.id === day.id ? { ...item, items: updater(item.items).map((workoutItem, index) => ({ ...workoutItem, sortOrder: index })) } : item) };
    setActivePlan(next);
    setPlans((previous) => [next, ...previous.filter((item) => item.id !== next.id)]);
    if (saveTimeoutRef.current !== null) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => { void persistPlan(next); }, 700);
  };
  const removePlan = async (plan: WorkoutPlan) => {
    if (!window.confirm('למחוק את התוכנית הזו?')) return;
    const ok = await repository.deleteWorkoutPlan(plan.id);
    if (!ok) { setError('לא ניתן למחוק את התוכנית כרגע.'); return; }
    const remaining = plans.filter((item) => item.id !== plan.id);
    setPlans(remaining); setActivePlan(remaining[0] || null); setActiveDayId(remaining[0]?.days[0]?.id || '');
  };
  const toggleFocus = (focus: WorkoutFocus) => setFocuses((current) => current.includes(focus) ? current.filter((item) => item !== focus) : [...current, focus]);

  const startWorkout = (dayIndex: number) => {
    setPlayerDayIndex(dayIndex); setPlayerItemIndex(0); setSetNumber(1); setRestLeft(null);
  };
  const finishSet = () => {
    if (playerDayIndex === null || playerItemIndex === null || !activePlan) return;
    const item = activePlan.days[playerDayIndex]?.items[playerItemIndex];
    if (!item) return;
    if (setNumber < item.sets) { setRestLeft(item.restSeconds); setSetNumber((n) => n + 1); }
    else if (playerItemIndex < activePlan.days[playerDayIndex].items.length - 1) { setPlayerItemIndex((n) => (n ?? 0) + 1); setSetNumber(1); setRestLeft(null); }
    else { setPlayerDayIndex(null); setPlayerItemIndex(null); setRestLeft(null); }
  };
  const currentPlayerItem = playerDayIndex !== null && playerItemIndex !== null ? activePlan?.days[playerDayIndex]?.items[playerItemIndex] : null;
  const currentPlayerExercise = currentPlayerItem ? EXERCISES.find((exercise) => exercise.id === currentPlayerItem.exerciseId) || null : null;

  return <div dir="rtl" className="space-y-4 pb-6">
    <header className="rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-500 p-5 text-white shadow-lg shadow-teal-900/10">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-white/15 p-3"><Dumbbell className="h-6 w-6" /></div><div><p className="text-sm text-teal-50">תנועה בקצב שלך</p><h1 className="text-2xl font-black">אימונים</h1><p className="mt-1 text-sm text-teal-50">תוכנית אישית, תרגילים וסרטוני הדרכה במקום אחד</p></div></div>
    </header>
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm">
      <button onClick={() => setScreen('plan')} className={`min-h-11 rounded-xl text-sm font-bold ${screen === 'plan' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}>התוכנית שלי</button>
      <button onClick={() => setScreen('library')} className={`min-h-11 rounded-xl text-sm font-bold ${screen === 'library' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}>ספריית תרגילים</button>
    </div>
    {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
    {loading ? <div className="rounded-2xl bg-white p-6 text-center text-slate-500">טוען את התוכניות…</div> : screen === 'library' ? <>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <select aria-label="סינון קבוצת שרירים" className="rounded-xl border border-slate-200 p-2 text-xs" value={filters.muscle} onChange={(e) => setFilters({ ...filters, muscle: e.target.value })}><option value="">כל השרירים</option>{muscleOptions.map((value) => <option key={value} value={value}>{MUSCLE_LABELS[value] || value}</option>)}</select>
        <select aria-label="סינון ציוד" className="rounded-xl border border-slate-200 p-2 text-xs" value={filters.equipment} onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}><option value="">כל הציוד</option>{equipmentOptions.map((value) => <option key={value} value={value}>{EQUIPMENT_LABELS[value] || value}</option>)}</select>
        <select aria-label="סינון רמת קושי" className="rounded-xl border border-slate-200 p-2 text-xs" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">כל הרמות</option>{Object.entries(DIFFICULTY_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="סינון סוג תנועה" className="rounded-xl border border-slate-200 p-2 text-xs" value={filters.movement} onChange={(e) => setFilters({ ...filters, movement: e.target.value })}><option value="">כל סוגי התנועה</option>{movementOptions.map((value) => <option key={value} value={value}>{MOVEMENT_LABELS[value] || value.replaceAll('-', ' ')}</option>)}</select>
      </div>
      <p className="text-xs text-slate-500">{filteredExercises.length} תרגילים</p>
      <div className="space-y-3">{filteredExercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} onPlay={() => setPlayerExercise(exercise)} onAdd={activePlan && activeDay ? () => updateDay(activeDay, (items) => [...items, { id: uid(), exerciseId: exercise.id, sets: 3, targetType: 'reps', targetValue: '8–12', restSeconds: 60, sortOrder: items.length }]) : undefined} />)}</div>
    </> : <>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-teal-700"/><h2 className="text-lg font-extrabold text-slate-900">בונים לך תוכנית</h2></div>
        <p className="mb-4 text-sm text-slate-600">בחר כמה אימונים לעשות בכל שבוע, מה תרצה לאמן וכמה זמן להקדיש לאימון.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-600">אימונים בשבוע<select className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>{[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">משך התוכנית בשבועות<input className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" type="number" min="1" max="52" value={durationWeeks} onChange={(e) => setDurationWeeks(Math.max(1, Math.min(52, Number(e.target.value))))}/></label>
          <label className="text-xs font-semibold text-slate-600">משך אימון מינימלי (דקות)<input className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" type="number" min="10" max="180" value={durationMinMinutes} onChange={(e) => setDurationMinMinutes(Math.max(10, Math.min(180, Number(e.target.value))))}/></label>
          <label className="text-xs font-semibold text-slate-600">משך אימון מרבי (דקות)<input className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" type="number" min={durationMinMinutes} max="180" value={durationMaxMinutes} onChange={(e) => setDurationMaxMinutes(Math.max(durationMinMinutes, Math.min(180, Number(e.target.value))))}/></label>
        </div>
        <fieldset className="mt-4"><legend className="mb-2 text-xs font-bold text-slate-600">מה תרצה לשלב בתוכנית?</legend><div className="grid grid-cols-2 gap-2">{FOCUSES.map((focus) => <label key={focus} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${focuses.includes(focus) ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-700'}`}><input type="checkbox" checked={focuses.includes(focus)} onChange={() => toggleFocus(focus)} />{FOCUS_LABELS[focus]}</label>)}</div></fieldset>
        {focuses.includes('cardio') && cardioCount < 5 && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">בספרייה כרגע יש {cardioCount} תרגילי אירובי מבוססי משקל גוף, לכן האימונים האירוביים יהיו מגוונים במבנה ובסדר אך מבחר התרגילים מצומצם.</p>}
        <button onClick={() => void generate()} disabled={!focuses.length || durationMaxMinutes < durationMinMinutes} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-4 py-3 font-bold text-white shadow-md shadow-teal-700/20 disabled:opacity-50"><Sparkles className="h-4 w-4"/>צור תוכנית אימונים</button>
      </section>
      {plans.length > 0 && <div className="flex gap-2 overflow-auto pb-1">{plans.map((plan) => <button key={plan.id} onClick={() => { setActivePlan(plan); setActiveDayId(plan.days[0]?.id || ''); }} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${activePlan?.id === plan.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>{plan.name.slice(0, 30)}</button>)}</div>}
      {activePlan && <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">תוכנית {activePlan.durationWeeks} שבועות · {activePlan.daysPerWeek} אימונים בשבוע</p><h2 className="mt-1 text-lg font-extrabold">{activePlan.name}</h2><p className="mt-1 text-xs text-slate-500">זמן האימון מחושב כהערכה לפי סטים ומנוחות.</p></div><button aria-label="מחיקת התוכנית" onClick={() => void removePlan(activePlan)} className="rounded-xl bg-rose-50 p-2 text-rose-700"><Trash2 className="h-4 w-4"/></button></div>
        <div className="flex gap-2 overflow-auto">{activePlan.days.map((day) => <button key={day.id} onClick={() => setActiveDayId(day.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${day.id === activeDay?.id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>אימון {day.dayNumber} · {FOCUS_LABELS[day.focus]}</button>)}</div>
        {activeDay && <><div className="flex items-center gap-1.5 text-xs text-slate-600"><Clock3 className="h-4 w-4"/>כ־{estimateWorkoutMinutes(activeDay)} דקות</div><div className="space-y-2">{activeDay.items.map((item,index) => {
          const exercise=EXERCISES.find((entry)=>entry.id===item.exerciseId);
          if (!exercise) return null;
          return <div key={item.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{index+1}. {exercise.nameHe}</p><p className="mt-1 text-xs text-slate-500">{item.sets} סטים · {item.targetValue} {item.targetType === 'time' ? '' : 'חזרות'} · {item.restSeconds} שנ׳ מנוחה</p></div><div className="flex gap-1"><button aria-label="העלה תרגיל" disabled={index===0} onClick={()=>updateDay(activeDay,(items)=>{const next=[...items];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})} className="rounded-lg bg-slate-100 p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4"/></button><button aria-label="הורד תרגיל" disabled={index===activeDay.items.length-1} onClick={()=>updateDay(activeDay,(items)=>{const next=[...items];[next[index+1],next[index]]=[next[index],next[index+1]];return next;})} className="rounded-lg bg-slate-100 p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4"/></button><button aria-label="הסר תרגיל" onClick={()=>updateDay(activeDay,(items)=>items.filter((entry)=>entry.id!==item.id))} className="rounded-lg bg-rose-50 p-2 text-rose-700"><X className="h-4 w-4"/></button></div></div><div className="mt-3 grid grid-cols-3 gap-2"><label className="text-[10px] font-semibold text-slate-500">סטים<input type="number" min="1" max="20" value={item.sets} onChange={(e)=>updateDay(activeDay,(items)=>items.map((entry)=>entry.id===item.id?{...entry,sets:Math.max(1,Number(e.target.value))}:entry))} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-900"/></label><label className="text-[10px] font-semibold text-slate-500">{item.targetType==='time'?'זמן':'חזרות'}<input value={item.targetValue} onChange={(e)=>updateDay(activeDay,(items)=>items.map((entry)=>entry.id===item.id?{...entry,targetValue:e.target.value}:entry))} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-900"/></label><label className="text-[10px] font-semibold text-slate-500">מנוחה (שניות)<input type="number" min="0" max="600" value={item.restSeconds} onChange={(e)=>updateDay(activeDay,(items)=>items.map((entry)=>entry.id===item.id?{...entry,restSeconds:Math.max(0,Number(e.target.value))}:entry))} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-900"/></label></div><button onClick={()=>setPlayerExercise(exercise)} className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700"><Video className="h-3.5 w-3.5"/>צפה בהדגמה</button></div>;
        })}</div>
        <label className="block text-xs font-semibold text-slate-600">הוסף תרגיל<select onChange={(e)=>{const exercise=EXERCISES.find((entry)=>entry.id===e.target.value);if(exercise)updateDay(activeDay,(items)=>[...items,{id:uid(),exerciseId:exercise.id,sets:3,targetType:'reps',targetValue:'8–12',restSeconds:60,sortOrder:items.length}]);e.target.value='';}} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="">בחירת תרגיל מהספרייה…</option>{EXERCISES.map((exercise)=><option key={exercise.id} value={exercise.id}>{exercise.nameHe}</option>)}</select></label>
        <button onClick={()=>startWorkout(activePlan.days.findIndex((day)=>day.id===activeDay.id))} disabled={!activeDay.items.length} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 font-bold text-white disabled:opacity-50"><Play className="h-4 w-4 fill-current"/>התחל אימון</button></>}</section>}
      {!activePlan && <div className="rounded-2xl bg-white p-5 text-sm text-slate-600">עדיין אין תוכנית שמורה. בחר את ההעדפות שלך וצור תוכנית ראשונה.</div>}
    </>}
    {playerDayIndex !== null && currentPlayerItem && currentPlayerExercise && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/75 p-2 sm:items-center" role="dialog" aria-modal="true" dir="rtl"><div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-teal-700">תרגיל {playerItemIndex!+1} מתוך {activePlan!.days[playerDayIndex].items.length}</p><h2 className="text-xl font-black">{currentPlayerExercise.nameHe}</h2></div><button aria-label="סיום האימון" onClick={()=>{setPlayerDayIndex(null);setRestLeft(null);}} className="rounded-xl bg-slate-100 p-2"><X className="h-5 w-5"/></button></div><p className="mt-2 text-sm text-slate-600">סט {setNumber} מתוך {currentPlayerItem.sets} · {currentPlayerItem.targetValue} {currentPlayerItem.targetType==='time'?'':'חזרות'}</p><button onClick={()=>setPlayerExercise(currentPlayerExercise)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal-50 font-bold text-teal-900"><Video className="h-5 w-5"/>צפה בסרטון ההדגמה</button>{restLeft !== null && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center"><p className="text-xs font-semibold text-amber-900">זמן מנוחה</p><p className="text-4xl font-black tabular-nums text-amber-950">{Math.floor(restLeft/60)}:{String(restLeft%60).padStart(2,'0')}</p><button onClick={()=>setRestLeft(0)} className="mt-2 text-xs font-bold text-amber-900 underline">דלג על המנוחה</button></div>}<button onClick={finishSet} disabled={restLeft!==null&&restLeft>0} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 text-base font-extrabold text-white disabled:opacity-50"><Check className="h-5 w-5"/>{restLeft!==null&&restLeft>0?'נחים…':setNumber<currentPlayerItem.sets?'סיימתי סט':'המשך לתרגיל הבא'}</button></div></div>}
    {playerExercise && <WorkoutPlayer exercise={playerExercise} onClose={()=>setPlayerExercise(null)} />}
  </div>;
};

const ExerciseCard: React.FC<{exercise: Exercise;onPlay:()=>void;onAdd?:()=>void}> = ({exercise,onPlay,onAdd}) => <article className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className="flex-1"><h3 className="font-extrabold text-slate-900">{exercise.nameHe}</h3><p className="mt-0.5 text-xs text-slate-500">{exercise.nameEn} · {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}</p></div><button onClick={onPlay} aria-label={`נגן הדגמה: ${exercise.nameHe}`} className="rounded-xl bg-teal-50 p-3 text-teal-800"><Play className="h-4 w-4 fill-current"/></button></div><div className="mt-3 flex flex-wrap gap-1.5">{exercise.primaryMuscles.map((muscle)=><span key={muscle} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">{MUSCLE_LABELS[muscle]||muscle}</span>)}</div><p className="mt-2 text-xs text-slate-600">ציוד: {exercise.equipment.map((item)=>EQUIPMENT_LABELS[item]||item).join(', ')}</p>{onAdd && <button onClick={onAdd} className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-teal-200 text-xs font-bold text-teal-800"><Plus className="h-4 w-4"/>הוסף לאימון הנבחר</button>}</article>;
