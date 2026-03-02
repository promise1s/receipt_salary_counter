/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  X,
  Copy
} from 'lucide-react';
import { UserProfile, WishItem, SalarySnapshot, SalaryInputType } from './types';
import { DEFAULT_PROFILE, RECEIPT_WIDTH, RECEIPT_HEIGHT } from './constants';
import { storage } from './services/storage';
import { salaryEngine } from './services/salaryEngine';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [snapshot, setSnapshot] = useState<SalarySnapshot | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);

  // Load initial data
  useEffect(() => {
    const savedProfile = storage.loadProfile();
    const savedWishes = storage.loadWishes();
    if (savedProfile) {
      setProfile(savedProfile);
    } else {
      setIsSetupOpen(true);
    }
    setWishes(savedWishes);
  }, []);

  // Ticker
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    (window as any).setSimulatedTime = setSimulatedTime;
    return () => { delete (window as any).setSimulatedTime; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (simulatedTime) {
        setSimulatedTime(prev => {
          if (!prev) return null;
          return new Date(new Date(prev).getTime() + 100).toISOString();
        });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [simulatedTime]);

  useEffect(() => {
    if (!profile) return;
    const now = simulatedTime ? new Date(simulatedTime) : currentTime;
    const newSnapshot = salaryEngine.computeSnapshot(now, profile);
    setSnapshot(newSnapshot);
  }, [profile, simulatedTime, currentTime]);

  const handleSaveProfile = (newProfile: UserProfile) => {
    storage.saveProfile(newProfile);
    setProfile(newProfile);
    setIsSetupOpen(false);
    setIsSettingsOpen(false);
  };

  const handleAddWish = (title: string, amount: number) => {
    const newWish: WishItem = {
      id: crypto.randomUUID(),
      title,
      amount,
      createdAt: Date.now(),
    };
    const newWishes = [...wishes, newWish];
    setWishes(newWishes);
    storage.saveWishes(newWishes);
    setIsWishModalOpen(false);
  };

  const handleDeleteWish = (id: string) => {
    const newWishes = wishes.filter(w => w.id !== id);
    setWishes(newWishes);
    storage.saveWishes(newWishes);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <div 
        className="receipt-paper rounded-sm flex flex-col"
        style={{ width: RECEIPT_WIDTH, height: RECEIPT_HEIGHT }}
      >
        {!profile || isSetupOpen ? (
          <SetupWizard onFinish={handleSaveProfile} initialProfile={profile} />
        ) : (
          <ReceiptView 
            snapshot={snapshot} 
            wishes={wishes}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onAddWish={() => {
              setEditingWish(null);
              setIsWishModalOpen(true);
            }}
            onDeleteWish={handleDeleteWish}
            onCopy={handleCopy}
            profile={profile}
            isSimulated={!!simulatedTime}
            onStopSimulation={() => {
              (window as any).simulatedActive = false;
              setSimulatedTime(null);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isWishModalOpen && (
          <WishModal 
            onClose={() => setIsWishModalOpen(false)} 
            onSave={handleAddWish} 
          />
        )}
        {isSettingsOpen && profile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-sm shadow-2xl overflow-hidden flex flex-col"
              style={{ width: RECEIPT_WIDTH, height: RECEIPT_HEIGHT }}
            >
              <div className="p-6 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h2 className="text-lg font-bold">Settings</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SetupWizard onFinish={handleSaveProfile} initialProfile={profile} isSettings />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SetupWizard({ 
  onFinish, 
  initialProfile,
  isSettings = false 
}: { 
  onFinish: (p: UserProfile) => void, 
  initialProfile: UserProfile | null,
  isSettings?: boolean
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>(() => ({
    ...DEFAULT_PROFILE,
    ...(initialProfile || {})
  }));

  const isStep1Valid = (
    (formData.salaryInputType === SalaryInputType.DAILY 
      ? (formData.dailySalary || 0) > 0 && (formData.attendanceDaysPerMonth || 0) > 0 
      : formData.monthlySalary > 0) && 
    formData.dailyWorkHours >= 0.5 && 
    formData.dailyWorkHours <= 16
  );
  const isStep2Valid = formData.birthDate !== '' && formData.graduationDate !== '' && formData.retirementAge > 0;

  const nextStep = () => setStep(2);
  const prevStep = () => setStep(1);

  const minutesToTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const timeStrToMinutes = (str: string) => {
    const [h, m] = str.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  return (
    <div className="flex flex-col h-full">
      {!isSettings && (
        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-bold mb-1">Setup</h1>
          <p className="text-zinc-500 text-xs">Step {step} of 2</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Salary Mode</label>
              <div className="flex p-1 bg-zinc-100 rounded-lg">
                {[SalaryInputType.MONTHLY, SalaryInputType.ANNUAL, SalaryInputType.DAILY].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setFormData({...formData, salaryInputType: mode})}
                    className={`flex-1 py-2 text-[10px] font-medium rounded-md transition-all ${formData.salaryInputType === mode ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {formData.salaryInputType === SalaryInputType.DAILY ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Daily Salary</label>
                  <input 
                    type="number"
                    value={formData.dailySalary || ''}
                    onChange={(e) => setFormData({...formData, dailySalary: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400">Attendance Days</label>
                  <input 
                    type="number"
                    min="1"
                    max="31"
                    value={formData.attendanceDaysPerMonth || ''}
                    onChange={(e) => setFormData({...formData, attendanceDaysPerMonth: parseInt(e.target.value) || 0})}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    placeholder="1-31"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400">
                  {formData.salaryInputType === SalaryInputType.MONTHLY ? 'Monthly' : 'Annual'} Salary
                </label>
                <input 
                  type="number"
                  value={formData.salaryInputType === SalaryInputType.MONTHLY ? formData.monthlySalary : formData.monthlySalary * 12}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData, 
                      monthlySalary: formData.salaryInputType === SalaryInputType.MONTHLY ? val : val / 12
                    });
                  }}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400">Payday</label>
                <input 
                  type="number"
                  min="1"
                  max="31"
                  value={formData.payday ?? ''}
                  onChange={(e) => setFormData({...formData, payday: parseInt(e.target.value) || 1})}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400">Workdays / Week</label>
                <div className="flex p-1 bg-zinc-100 rounded-lg">
                  {[5, 6].map((d) => (
                    <button 
                      key={d}
                      onClick={() => setFormData({...formData, workdaysPerWeek: d as 5 | 6})}
                      className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${formData.workdaysPerWeek === d ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400">Work Start Time</label>
                <input 
                  type="time"
                  value={minutesToTimeStr(formData.workStartTimeMinutes)}
                  onChange={(e) => setFormData({...formData, workStartTimeMinutes: timeStrToMinutes(e.target.value)})}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400">Work Hours/Day</label>
                <input 
                  type="number"
                  step="0.5"
                  value={formData.dailyWorkHours ?? ''}
                  onChange={(e) => setFormData({...formData, dailyWorkHours: parseFloat(e.target.value) || 8})}
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.hasMealSubsidy ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.hasMealSubsidy ? 'translate-x-4' : ''}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.hasMealSubsidy} onChange={(e) => setFormData({...formData, hasMealSubsidy: e.target.checked})} />
                  <span className="text-sm font-medium">Meal Subsidy</span>
                </label>
                {formData.hasMealSubsidy && (
                  <div className="pl-13 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Subsidy Time</label>
                    <input 
                      type="time"
                      value={minutesToTimeStr(formData.mealTimeMinutes)}
                      onChange={(e) => setFormData({...formData, mealTimeMinutes: timeStrToMinutes(e.target.value)})}
                      className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.hasTaxiSubsidy ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.hasTaxiSubsidy ? 'translate-x-4' : ''}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.hasTaxiSubsidy} onChange={(e) => setFormData({...formData, hasTaxiSubsidy: e.target.checked})} />
                  <span className="text-sm font-medium">Taxi Subsidy</span>
                </label>
                {formData.hasTaxiSubsidy && (
                  <div className="pl-13 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Subsidy Time</label>
                    <input 
                      type="time"
                      value={minutesToTimeStr(formData.taxiTimeMinutes)}
                      onChange={(e) => setFormData({...formData, taxiTimeMinutes: timeStrToMinutes(e.target.value)})}
                      className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Birth Date</label>
              <input 
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Graduation Date</label>
              <input 
                type="date"
                value={formData.graduationDate || ''}
                onChange={(e) => setFormData({...formData, graduationDate: e.target.value})}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Retirement Age</label>
              <input 
                type="number"
                value={formData.retirementAge ?? ''}
                onChange={(e) => setFormData({...formData, retirementAge: parseInt(e.target.value) || 60})}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={() => {
                  // Set up the test case: 250 CNY daily, 10:00 start, 8 hours
                  // Today is Feb 17, 2026 (12th workday) at 15:00
                  const testProfile: UserProfile = {
                    ...formData,
                    salaryInputType: SalaryInputType.DAILY,
                    dailySalary: 250,
                    attendanceDaysPerMonth: 16,
                    workStartTimeMinutes: 600, // 10:00
                    dailyWorkHours: 8,
                    workdaysPerWeek: 5,
                    graduationDate: '2026-06-01',
                    birthDate: '1995-01-01',
                  };
                  setFormData(testProfile);
                  // Global state update for simulation
                  (window as any).simulatedActive = true;
                  (window as any).setSimulatedTime?.('2026-02-17T15:00:00');
                }}
                className="w-full py-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                Simulate Test Case (Feb 17, 15:00)
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step === 2 && (
          <button 
            onClick={prevStep}
            className="flex-1 py-4 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} /> Back
          </button>
        )}
        <button 
          onClick={step === 1 ? nextStep : () => onFinish(formData)}
          disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
          className="flex-[2] py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {step === 1 ? 'Next' : 'Finish'} {step === 1 ? <ChevronRight size={20} /> : <Check size={20} />}
        </button>
      </div>
    </div>
  );
}

import { RollingNumber } from './components/RollingNumber';

// ... (imports remain the same)

// ... (SetupWizard and other components remain the same)

function ReceiptView({ 
  snapshot, 
  wishes, 
  onOpenSettings, 
  onAddWish, 
  onDeleteWish,
  onCopy,
  profile,
  isSimulated,
  onStopSimulation
}: { 
  snapshot: SalarySnapshot | null, 
  wishes: WishItem[],
  onOpenSettings: () => void,
  onAddWish: () => void,
  onDeleteWish: (id: string) => void,
  onCopy: (t: string) => void,
  profile: UserProfile,
  isSimulated?: boolean,
  onStopSimulation?: () => void
}) {
  if (!snapshot) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const calculateWorkDays = (amount: number) => {
    const monthlySalary = profile.salaryInputType === SalaryInputType.DAILY 
      ? (profile.dailySalary || 0) * (profile.attendanceDaysPerMonth || 0)
      : profile.monthlySalary;
    
    const dailySalary = profile.salaryInputType === SalaryInputType.DAILY
      ? (profile.dailySalary || 0)
      : monthlySalary / snapshot.totalWorkdaysInMonth;

    if (dailySalary <= 0) return 0;
    return amount / dailySalary;
  };

  const minutesToTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Simulation Indicator */}
      {isSimulated && (
        <div className="bg-emerald-500 text-white text-[10px] font-bold py-1 px-4 flex justify-between items-center uppercase tracking-widest">
          <span>Simulation Mode Active</span>
          <button 
            onClick={onStopSimulation}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="p-6 text-center space-y-1">
        <h2 className="receipt-text text-sm font-bold">Salary Receipt</h2>
        <p className="receipt-text text-[10px] text-zinc-400">
          DATE: {snapshot.now.toLocaleDateString()} {snapshot.now.toLocaleTimeString([], { hour12: false })}
        </p>
      </div>

      <div className="receipt-divider mx-6" />

      {/* Today Earned */}
      <div className="px-6 py-4 text-center space-y-2">
        <p className="receipt-text text-xs font-medium text-zinc-500">Today Earned</p>
        <div 
          onClick={() => onCopy(snapshot.todayEarned.toFixed(2))}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <RollingNumber value={snapshot.todayEarned} fontSize={36} className="font-bold" />
        </div>
        <p className="receipt-text text-[9px] text-zinc-400">
          {formatCurrency(
            (profile.salaryInputType === SalaryInputType.DAILY 
              ? (profile.dailySalary || 0) 
              : (profile.monthlySalary / snapshot.totalWorkdaysInMonth)) / profile.dailyWorkHours
          )}/h
        </p>

        {/* Subsidies Row - Symmetrical Layout */}
        {(snapshot.mealCountdown || snapshot.taxiCountdown) && (
          <div className="flex justify-between items-center pt-3 gap-4 border-t border-dashed border-zinc-200 mt-3">
            <div className="flex-1 text-center">
              {snapshot.mealCountdown ? (
                <div className="flex flex-col">
                  <span className="receipt-text text-[10px] text-zinc-400 uppercase">Meal Subsidy</span>
                  <span className="receipt-text text-xs font-bold text-zinc-600 font-mono">{snapshot.mealCountdown.displayHHMMSS}</span>
                </div>
              ) : (
                <div className="flex flex-col opacity-30">
                  <span className="receipt-text text-[10px] text-zinc-400 uppercase">Meal Subsidy</span>
                  <span className="receipt-text text-xs font-bold text-zinc-600 font-mono">--:--:--</span>
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-zinc-200" />
            <div className="flex-1 text-center">
              {snapshot.taxiCountdown ? (
                <div className="flex flex-col">
                  <span className="receipt-text text-[10px] text-zinc-400 uppercase">Taxi Subsidy</span>
                  <span className="receipt-text text-xs font-bold text-zinc-600 font-mono">{snapshot.taxiCountdown.displayHHMMSS}</span>
                </div>
              ) : (
                <div className="flex flex-col opacity-30">
                  <span className="receipt-text text-[10px] text-zinc-400 uppercase">Taxi Subsidy</span>
                  <span className="receipt-text text-xs font-bold text-zinc-600 font-mono">--:--:--</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="receipt-divider mx-6" />

      {/* Line Items */}
      <div className="px-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="receipt-text text-xs text-zinc-500">Monthly Cumulative Income</span>
          <div className="text-right">
             <RollingNumber value={snapshot.monthlyCumulativeIncome} fontSize={14} className="font-bold text-xs" />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="receipt-text text-xs text-zinc-500">Days Until Work Start</span>
          <span className="receipt-text text-xs font-bold">{snapshot.daysUntilWorkStart} Days</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="receipt-text text-xs text-zinc-500">Retirement In</span>
          <span className="receipt-text text-xs font-bold">{snapshot.retirementDaysLeft} Days</span>
        </div>
      </div>

      <div className="receipt-divider mx-6" />

      {/* Wishlist */}
      <div className="px-6 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="receipt-text text-xs font-bold">Wishlist</h3>
          <button 
            onClick={onAddWish}
            className="p-1 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="space-y-4">
          {wishes.length === 0 ? (
            <p className="receipt-text text-[10px] text-zinc-300 italic text-center py-4">No wishes yet...</p>
          ) : (
            wishes.map((wish) => {
              const workDays = calculateWorkDays(wish.amount);
              return (
                <div key={wish.id} className="flex justify-between items-start group">
                  <div className="flex flex-col">
                    <span className="receipt-text text-[11px] font-medium truncate max-w-[150px]">{wish.title}</span>
                    <span className="receipt-text text-[8px] text-zinc-400">{new Date(wish.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="receipt-text text-[12px] font-bold text-zinc-900">{workDays.toFixed(1)} Days</span>
                      <button 
                        onClick={() => onDeleteWish(wish.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="receipt-text text-[9px] text-zinc-400">{formatCurrency(wish.amount)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 mt-auto flex justify-between items-center">
        <span className="receipt-text text-[8px] text-zinc-300">v1.1.0-PROD</span>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}

function WishModal({ onClose, onSave }: { onClose: () => void, onSave: (t: string, a: number) => void }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Add Wish</h2>
            <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Item Name</label>
              <input 
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                placeholder="New iPhone..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-400">Amount</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <button 
            onClick={() => onSave(title, parseFloat(amount) || 0)}
            disabled={!title || !amount}
            className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all"
          >
            Add to Wishlist
          </button>
        </div>
      </motion.div>
    </div>
  );
}
