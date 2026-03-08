# Toast & Modal Usage Guide

## Toast (Đã có sẵn)

### Import
```typescript
import { toast } from '@/lib/toast';
```

### Sử dụng
```typescript
// Success
toast.success('Thành công!');

// Error
toast.error('Có lỗi xảy ra!');

// Warning
toast.warning('Cảnh báo!');

// Info
toast.info('Thông tin');

// With custom duration (ms)
toast.success('Thành công!', 5000);
```

## Confirm Modal

### Import
```typescript
import { useConfirm } from '@/hooks/useConfirm';
```

### Setup
```typescript
export default function MyComponent() {
  const { confirm, ConfirmDialog, closeModal, setLoading } = useConfirm();
  
  return (
    <>
      <ConfirmDialog />
      {/* Your component */}
    </>
  );
}
```

### Sử dụng
```typescript
const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc muốn xóa? Hành động này không thể hoàn tác.',
    confirmText: 'Xóa',
    cancelText: 'Hủy',
    type: 'danger', // 'danger' | 'warning' | 'info'
  });

  if (!confirmed) return;

  try {
    setLoading(true);
    await deleteItem(id);
    closeModal();
    toast.success('Xóa thành công!');
  } catch (error: any) {
    toast.error(error.message);
    setLoading(false); // Keep modal open on error
  }
};
```

## Ví dụ hoàn chỉnh

```typescript
'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';

export default function EmployeeForm() {
  const [loading, setLoading] = useState(false);
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();

  const onSubmit = async (data: any) => {
    const confirmed = await confirm({
      title: 'Xác nhận tạo nhân viên',
      message: `Bạn có chắc muốn tạo nhân viên "${data.fullName}"?`,
      confirmText: 'Tạo mới',
      type: 'info',
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      setConfirmLoading(true);
      
      await createEmployee(data);
      
      closeModal();
      toast.success('Tạo nhân viên thành công!');
      router.push('/employees');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
      setConfirmLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </>
  );
}
```

## Thay thế alert() và confirm()

### Trước
```typescript
alert('Thành công!');
if (confirm('Bạn có chắc?')) {
  // do something
}
```

### Sau
```typescript
toast.success('Thành công!');

const confirmed = await confirm({
  title: 'Xác nhận',
  message: 'Bạn có chắc?',
});
if (confirmed) {
  // do something
}
```
