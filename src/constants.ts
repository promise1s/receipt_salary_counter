
import { UserProfile, SalaryInputType } from './types';

export const DEFAULT_PROFILE: UserProfile = {
  salaryInputType: SalaryInputType.MONTHLY,
  monthlySalary: 0,
  payday: 10,
  workdaysPerWeek: 5,
  dailyWorkHours: 8,
  hasMealSubsidy: true,
  hasTaxiSubsidy: true,
  birthDate: '',
  graduationDate: '',
  retirementAge: 60,
  workStartTimeMinutes: 570, // 09:30
  mealTimeMinutes: 720, // 12:00
  taxiTimeMinutes: 1260, // 21:00
};

export const AVG_WORKDAYS_5 = 22.75;
export const AVG_WORKDAYS_6 = 27.30;

export const RECEIPT_WIDTH = 360;
export const RECEIPT_HEIGHT = 640;
