'use client';

import { use } from 'react';
import DepartmentForm from '@/components/departments/DepartmentForm';

export default function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DepartmentForm mode="edit" departmentId={id} />;
}
