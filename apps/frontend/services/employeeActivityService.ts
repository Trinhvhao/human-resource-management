import axios from '@/lib/axios';
import { EmployeeActivityResponse, ActivityStatsResponse } from '@/types/employee-activity';

export const employeeActivityService = {
  /**
   * Get employee activities
   */
  async getActivities(
    employeeId: string,
    params?: {
      type?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<EmployeeActivityResponse> {
    const response = await axios.get(`/employees/${employeeId}/activities`, { params });
    return response.data;
  },

  /**
   * Get activity statistics
   */
  async getStats(employeeId: string): Promise<ActivityStatsResponse> {
    const response = await axios.get(`/employees/${employeeId}/activities/stats`);
    return response.data;
  },
};
