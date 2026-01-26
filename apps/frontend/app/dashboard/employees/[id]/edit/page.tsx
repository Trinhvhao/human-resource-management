'use client';

import EmployeeForm from '@/components/employees/EmployeeForm';

export default function EditEmployeePage({ params }: { params: { id: string } }) {
    return <EmployeeForm mode="edit" employeeId={params.id} />;
}
