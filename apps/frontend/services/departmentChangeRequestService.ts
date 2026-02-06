import axios from '@/lib/axios';
import { 
  DepartmentChangeRequest, 
  CreateChangeRequestDto, 
  ReviewChangeRequestDto,
  ChangeRequestStatus 
} from '@/types/department-change-request';

class DepartmentChangeRequestService {
  private baseUrl = '/departments';

  /**
   * Create a change request for a department
   */
  async createChangeRequest(departmentId: string, data: CreateChangeRequestDto) {
    const response = await axios.post<{ success: boolean; data: DepartmentChangeRequest }>(
      `${this.baseUrl}/${departmentId}/change-requests`,
      data
    );
    return response.data;
  }

  /**
   * Get all change requests with optional filters
   */
  async getChangeRequests(filters?: { 
    status?: ChangeRequestStatus; 
    departmentId?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    
    const response = await axios.get<{ success: boolean; data: DepartmentChangeRequest[] }>(
      `${this.baseUrl}/change-requests?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get a specific change request by ID
   */
  async getChangeRequest(requestId: string) {
    const response = await axios.get<{ success: boolean; data: DepartmentChangeRequest }>(
      `${this.baseUrl}/change-requests/${requestId}`
    );
    return response.data;
  }

  /**
   * Review (approve/reject) a change request
   */
  async reviewChangeRequest(requestId: string, data: ReviewChangeRequestDto) {
    const response = await axios.patch<{ success: boolean; data: DepartmentChangeRequest }>(
      `${this.baseUrl}/change-requests/${requestId}/review`,
      data
    );
    return response.data;
  }

  /**
   * Cancel a pending change request
   */
  async cancelChangeRequest(requestId: string) {
    const response = await axios.patch<{ success: boolean; data: DepartmentChangeRequest }>(
      `${this.baseUrl}/change-requests/${requestId}`,
      { status: 'CANCELLED' }
    );
    return response.data;
  }
}

export default new DepartmentChangeRequestService();
