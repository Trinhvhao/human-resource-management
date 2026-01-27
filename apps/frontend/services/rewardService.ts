import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Reward, CreateRewardData } from '@/types/reward';

interface QueryParams {
  employeeId?: string;
  page?: number;
  limit?: number;
}

class RewardService {
  async getAll(params?: QueryParams): Promise<ApiResponse<Reward[]>> {
    return axiosInstance.get('/rewards', { params });
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<Reward[]>> {
    return axiosInstance.get(`/rewards/employee/${employeeId}`);
  }

  async create(data: CreateRewardData): Promise<ApiResponse<Reward>> {
    return axiosInstance.post('/rewards', data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/rewards/${id}`);
  }
}

export default new RewardService();
