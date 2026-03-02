
import { 
  UserProfile, 
  SalarySnapshot, 
  Countdown, 
  WishItem,
  SalaryInputType
} from '../types';
import { AVG_WORKDAYS_5, AVG_WORKDAYS_6 } from '../constants';

export class SalaryEngine {
  private getAvgWorkdays(workdaysPerWeek: number): number {
    return workdaysPerWeek === 5 ? AVG_WORKDAYS_5 : AVG_WORKDAYS_6;
  }

  private isWorkday(date: Date, workdaysPerWeek: number): boolean {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (workdaysPerWeek === 5) {
      return day >= 1 && day <= 5;
    } else {
      return day >= 1 && day <= 6;
    }
  }

  private dateAtMinutes(date: Date, minutes: number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(minutes);
    return d;
  }

  private getActualDailySalary(now: Date, profile: UserProfile): number {
    if (profile.salaryInputType === SalaryInputType.DAILY) {
      return profile.dailySalary || 0;
    }
    const totalWorkdays = this.getTotalWorkdaysInMonth(now, profile.workdaysPerWeek);
    return profile.monthlySalary / totalWorkdays;
  }

  private getDerivedMonthlySalary(now: Date, profile: UserProfile): number {
    if (profile.salaryInputType === SalaryInputType.DAILY) {
      return (profile.dailySalary || 0) * (profile.attendanceDaysPerMonth || 0);
    }
    return profile.monthlySalary;
  }

  private getTotalWorkdaysInMonth(date: Date, workdaysPerWeek: number): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return this.countWorkdays(start, end, workdaysPerWeek);
  }

  private getElapsedWorkdaysInMonth(date: Date, workdaysPerWeek: number): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    return this.countWorkdays(start, todayStart, workdaysPerWeek);
  }

  private computeTodayEarned(now: Date, profile: UserProfile): number {
    if (!this.isWorkday(now, profile.workdaysPerWeek)) {
      return 0;
    }

    const dailySalary = this.getActualDailySalary(now, profile);
    const workSeconds = profile.dailyWorkHours * 3600;

    if (workSeconds <= 0) return 0;

    const start = this.dateAtMinutes(now, profile.workStartTimeMinutes);
    const end = new Date(start.getTime() + workSeconds * 1000);

    if (now <= start) return 0;
    if (now >= end) return dailySalary;

    const elapsed = (now.getTime() - start.getTime()) / 1000;
    const earned = (dailySalary * elapsed) / workSeconds;
    return Math.max(0, Math.min(dailySalary, earned));
  }

  private computeMonthlyCumulativeIncome(now: Date, profile: UserProfile): number {
    const dailySalary = this.getActualDailySalary(now, profile);
    const elapsedFullDays = this.getElapsedWorkdaysInMonth(now, profile.workdaysPerWeek);
    
    let income = elapsedFullDays * dailySalary;
    
    // Add today's progress if it's a workday
    if (this.isWorkday(now, profile.workdaysPerWeek)) {
      income += this.computeTodayEarned(now, profile);
    }
    
    return Math.max(0, income);
  }

  private countWorkdays(start: Date, end: Date, workdaysPerWeek: number): number {
    let count = 0;
    let d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (d < endDay) {
      if (this.isWorkday(d, workdaysPerWeek)) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  private nextWorkdayOccurrence(now: Date, minutes: number, profile: UserProfile): Date {
    let day = new Date(now);
    day.setHours(0, 0, 0, 0);

    while (true) {
      const candidate = this.dateAtMinutes(day, minutes);
      const isCandidateWorkday = this.isWorkday(candidate, profile.workdaysPerWeek);
      if (isCandidateWorkday && candidate > now) {
        return candidate;
      }
      day.setDate(day.getDate() + 1);
    }
  }

  private computeCountdown(now: Date, target: Date): Countdown {
    const remaining = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    const hh = Math.floor(remaining / 3600);
    const mm = Math.floor((remaining % 3600) / 60);
    const ss = remaining % 60;
    const display = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    return { target, remainingSeconds: remaining, displayHHMMSS: display };
  }

  private isLeapYear(year: number): boolean {
    return (year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
  }

  private computeRetirement(now: Date, profile: UserProfile): { date: Date; daysLeft: number } {
    const birth = new Date(profile.birthDate);
    const targetYear = birth.getFullYear() + profile.retirementAge;
    const month = birth.getMonth();
    let day = birth.getDate();

    if (month === 1 && day === 29 && !this.isLeapYear(targetYear)) {
      day = 28;
    }

    const retirementDate = new Date(targetYear, month, day);
    retirementDate.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const diffTime = retirementDate.getTime() - today.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return { date: retirementDate, daysLeft };
  }

  private computeWorkStartCountdown(now: Date, profile: UserProfile): number {
    if (!profile.graduationDate) return 0;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const target = new Date(profile.graduationDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  public computeSnapshot(now: Date, profile: UserProfile): SalarySnapshot {
    const today = this.computeTodayEarned(now, profile);
    const monthlyIncome = this.computeMonthlyCumulativeIncome(now, profile);
    const daysUntilWorkStart = this.computeWorkStartCountdown(now, profile);

    const meal: Countdown | null = profile.hasMealSubsidy
      ? this.computeCountdown(now, this.nextWorkdayOccurrence(now, profile.mealTimeMinutes, profile))
      : null;

    const taxi: Countdown | null = profile.hasTaxiSubsidy
      ? this.computeCountdown(now, this.nextWorkdayOccurrence(now, profile.taxiTimeMinutes, profile))
      : null;

    const retirement = this.computeRetirement(now, profile);
    const totalWorkdays = this.getTotalWorkdaysInMonth(now, profile.workdaysPerWeek);

    return {
      now,
      todayEarned: today,
      monthlyCumulativeIncome: monthlyIncome,
      totalWorkdaysInMonth: totalWorkdays,
      mealCountdown: meal,
      taxiCountdown: taxi,
      daysUntilWorkStart,
      retirementDaysLeft: retirement.daysLeft,
      retirementDate: retirement.date,
    };
  }
}

export const salaryEngine = new SalaryEngine();
