import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Reward, CreateRewardData, UpdateRewardData } from '@/types/reward';

interface QueryRewardParams {
  employeeId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class RewardService {
  async getAll(params?: QueryRewardParams): Promise<ApiResponse<Reward[]>> {
    return axiosInstance.get('/rewards', { params });
  }

  async getById(id: string): Promise<ApiResponse<Reward>> {
    return axiosInstance.get(`/rewards/${id}`);
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<Reward[]>> {
    return axiosInstance.get(`/rewards/employee/${employeeId}`);
  }

  async create(data: CreateRewardData): Promise<ApiResponse<Reward>> {
    return axiosInstance.post('/rewards', data);
  }

  async update(id: string, data: UpdateRewardData): Promise<ApiResponse<Reward>> {
    return axiosInstance.patch(`/rewards/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/rewards/${id}`);
  }
}

export default new RewardService();
