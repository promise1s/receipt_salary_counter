import { motion } from 'motion/react';
import { SalarySnapshot } from './types';
import { RollingNumber } from './components/RollingNumber';

interface WidgetViewProps {
  snapshot: SalarySnapshot | null;
}

export function WidgetView({ snapshot }: WidgetViewProps) {
  if (!snapshot) return null;

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between select-none border border-white/20 shadow-lg">
      {/* Today Earned */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Today Earned</span>
        <div className="flex items-baseline gap-0.5 text-zinc-900">
          <span className="text-sm font-medium">¥</span>
          <RollingNumber 
            value={snapshot.todayEarned} 
            toFixed={4} 
            className="text-2xl font-bold font-mono tracking-tight" 
          />
        </div>
      </div>

      {/* Subsidies */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-100">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Meal</span>
          <div className={`text-xs font-bold ${snapshot.isMealSubsidyActive ? 'text-emerald-600' : 'text-zinc-300'}`}>
            {snapshot.isMealSubsidyActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Taxi</span>
          <div className={`text-xs font-bold ${snapshot.isTaxiSubsidyActive ? 'text-emerald-600' : 'text-zinc-300'}`}>
            {snapshot.isTaxiSubsidyActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}
