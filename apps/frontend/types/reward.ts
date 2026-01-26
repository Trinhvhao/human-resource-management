export type RewardType = 'BONUS' | 'CERTIFICATE' | 'GIFT' | 'OTHER';

export interface Reward {
  id: string;
  employeeId: string;
  type: RewardType;
  title: string;
  description?: string;
  amount?: number;
  rewardDate: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
}

export interface CreateRewardData {
  employeeId: string;
  type: RewardType;
  title: string;
  description?: string;
  amount?: number;
  rewardDate: string;
}

export interface UpdateRewardData extends Partial<CreateRewardData> {}
