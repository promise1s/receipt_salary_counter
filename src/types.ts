
export enum SalaryInputType {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  DAILY = 'daily',
}

export interface UserProfile {
  salaryInputType: SalaryInputType;
  monthlySalary: number; // For monthly/annual, this is the normalized monthly salary
  dailySalary?: number; // For daily mode
  attendanceDaysPerMonth?: number; // For daily mode
  payday: number; // 1-31
  workdaysPerWeek: 5 | 6;
  dailyWorkHours: number;
  hasMealSubsidy: boolean;
  hasTaxiSubsidy: boolean;
  birthDate: string; // YYYY-MM-DD
  graduationDate: string; // YYYY-MM-DD
  retirementAge: number;
  workStartTimeMinutes: number; // default 9*60+30 = 570
  mealTimeMinutes: number; // default 12*60 = 720
  taxiTimeMinutes: number; // default 21*60 = 1260
}

export interface WishItem {
  id: string;
  title: string;
  amount: number;
  createdAt: number;
}

export interface Countdown {
  target: Date;
  remainingSeconds: number;
  displayHHMMSS: string;
}

export interface SalarySnapshot {
  now: Date;
  todayEarned: number;
  monthlyCumulativeIncome: number;
  totalWorkdaysInMonth: number;
  mealCountdown: Countdown | null;
  taxiCountdown: Countdown | null;
  daysUntilWorkStart: number;
  retirementDaysLeft: number;
  retirementDate: Date;
}
