'use client';

import DepartmentForm from '@/components/departments/DepartmentForm';

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
  return <DepartmentForm mode="edit" departmentId={params.id} />;
}
