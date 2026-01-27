'use client';

import { use } from 'react';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <EmployeeForm mode="edit" employeeId={id} />;
}
