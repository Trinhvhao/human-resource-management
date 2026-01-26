export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayData {
  name: string;
  date: string;
  isRecurring: boolean;
  description?: string;
}

export interface UpdateHolidayData extends Partial<CreateHolidayData> {}

export interface WorkDaysCalculation {
  startDate: string;
  endDate: string;
  totalDays: number;
  workDays: number;
  weekends: number;
  holidays: number;
  holidayList: Holiday[];
}
