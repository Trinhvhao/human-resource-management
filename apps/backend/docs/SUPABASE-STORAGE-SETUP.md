# 🗄️ Supabase Storage Setup Guide

## 📋 Overview

Hệ thống hỗ trợ 2 loại storage:
- **Local Storage** (mặc định) - Lưu file trong `uploads/` folder
- **Supabase Storage** (production) - Lưu file trên Supabase Cloud

Hệ thống tự động detect và sử dụng Supabase nếu được cấu hình, ngược lại fallback về local storage.

---

## 🚀 Setup Supabase Storage

### Bước 1: Tạo Storage Bucket

1. Vào Supabase Dashboard: https://app.supabase.com
2. Chọn project của bạn 
3. Vào **Storage** từ sidebar
4. Click **New bucket**
5. Tạo bucket với thông tin:
   - **Name:** `hrms-files`
   - **Public bucket:** ✅ Check (để files có thể access public)
   - Click **Create bucket**

### Bước 2: Cấu hình Policies (RLS)

Mặc định bucket sẽ có RLS (Row Level Security) enabled. Cần tạo policies để cho phép:

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hrms-files' );
```

Hoặc qua UI:
1. Click vào bucket `hrms-files`
2. Vào tab **Policies**
3. Click **New policy**
4. Chọn **For full customization**
5. Policy name: `Public Access`
6. Allowed operation: `SELECT`
7. Policy definition: `true`
8. Click **Review** và **Save policy**

#### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hrms-files' 
  AND auth.role() = 'authenticated'
);
```

Hoặc qua UI:
1. Click **New policy**
2. Policy name: `Authenticated Upload`
3. Allowed operation: `INSERT`
4. Policy definition: `bucket_id = 'hrms-files'`
5. Click **Review** và **Save policy**

#### Policy 3: Authenticated Delete
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hrms-files'
  AND auth.role() = 'authenticated'
);
```

### Bước 3: Lấy Service Role Key

1. Vào **Settings** > **API** trong Supabase Dashboard
2. Tìm section **Project API keys**
3. Copy **service_role** key (⚠️ Không phải anon key!)

### Bước 4: Cập nhật .env

Mở file `apps/backend/.env` và cập nhật:

```env
# Supabase
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Lưu ý:** 
- Thay `your-project-id` bằng project ID thực của bạn
- Paste service_role key đầy đủ (rất dài, ~200 ký tự)

### Bước 5: Restart Backend (nếu cần)

Nếu backend đang chạy, nó sẽ tự động reload. Kiểm tra log:

```
✅ Supabase Storage initialized
```

Nếu thấy:
```
📁 Using local file storage (Supabase not configured)
```

Nghĩa là credentials chưa đúng hoặc chưa được set.

---

## 🧪 Testing

### Test Upload

1. Vào http://localhost:3001/dashboard/employees
2. Click vào một nhân viên
3. Click tab **Hồ sơ chi tiết**
4. Upload avatar
5. Kiểm tra:
   - Nếu dùng Supabase: URL sẽ là `https://xxx.supabase.co/storage/v1/object/public/hrms-files/...`
   - Nếu dùng local: URL sẽ là `/uploads/avatars/...`

### Test Delete

1. Upload một document
2. Click nút Delete
3. Kiểm tra file đã bị xóa

---

## 📊 Storage Structure

### Supabase Bucket Structure:
```
hrms-files/
├── avatars/
│   ├── avatar-1234567890-123456789.jpg
│   └── avatar-1234567891-987654321.png
└── documents/
    ├── doc-1234567890-123456789-resume.pdf
    ├── doc-1234567891-987654321-id-card.jpg
    └── doc-1234567892-111111111-degree.pdf
```

### Local Storage Structure:
```
apps/backend/uploads/
├── avatars/
│   ├── avatar-1234567890-123456789.jpg
│   └── avatar-1234567891-987654321.png
└── documents/
    ├── doc-1234567890-123456789-resume.pdf
    ├── doc-1234567891-987654321-id-card.jpg
    └── doc-1234567892-111111111-degree.pdf
```

---

## 🔄 Migration từ Local sang Supabase

Nếu đã có files trong local storage và muốn chuyển sang Supabase:

### Option 1: Manual Upload (Recommended)
1. Vào Supabase Dashboard > Storage > hrms-files
2. Upload files thủ công vào đúng folders
3. Update database records với URLs mới

### Option 2: Script Migration
Tạo script để upload tất cả files từ local lên Supabase:

```typescript
// migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateFiles() {
  const uploadDir = path.join(__dirname, 'uploads');
  const folders = ['avatars', 'documents'];

  for (const folder of folders) {
    const folderPath = path.join(uploadDir, folder);
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const fileBuffer = fs.readFileSync(filePath);

      const { data, error } = await supabase.storage
        .from('hrms-files')
        .upload(`${folder}/${file}`, fileBuffer);

      if (error) {
        console.error(`Failed to upload ${file}:`, error);
      } else {
        console.log(`Uploaded ${file}`);
      }
    }
  }
}

migrateFiles();
```

---

## 🔒 Security Best Practices

### 1. Service Role Key
- ⚠️ **KHÔNG BAO GIỜ** commit service_role key vào Git
- ⚠️ **KHÔNG BAO GIỜ** expose service_role key ra frontend
- ✅ Chỉ dùng service_role key ở backend
- ✅ Add vào `.gitignore`: `.env`

### 2. Bucket Policies
- ✅ Enable RLS (Row Level Security)
- ✅ Chỉ cho phép authenticated users upload/delete
- ✅ Public read access cho avatars
- ⚠️ Private access cho sensitive documents

### 3. File Validation
- ✅ Validate file type (đã implement)
- ✅ Validate file size (đã implement)
- ✅ Sanitize file names (đã implement)

---

## 📈 Storage Limits

### Supabase Free Tier:
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **File size:** 50 MB max

### Supabase Pro Tier ($25/month):
- **Storage:** 100 GB
- **Bandwidth:** 200 GB/month
- **File size:** 5 GB max

### Local Storage:
- **Limit:** Tùy thuộc vào disk space của server
- **Backup:** Cần tự backup thủ công

---

## 🐛 Troubleshooting

### Issue 1: "Supabase not configured"
**Nguyên nhân:** Credentials chưa đúng hoặc chưa set

**Giải pháp:**
1. Kiểm tra `.env` file
2. Đảm bảo `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` đúng
3. Restart backend

### Issue 2: "Upload failed: Invalid bucket"
**Nguyên nhân:** Bucket `hrms-files` chưa được tạo

**Giải pháp:**
1. Vào Supabase Dashboard
2. Tạo bucket tên `hrms-files`
3. Set public access

### Issue 3: "Upload failed: Policy violation"
**Nguyên nhân:** RLS policies chưa được setup

**Giải pháp:**
1. Vào Storage > Policies
2. Tạo policies như hướng dẫn ở trên

### Issue 4: Files không hiển thị
**Nguyên nhân:** Bucket không public hoặc policies sai

**Giải pháp:**
1. Kiểm tra bucket settings
2. Đảm bảo "Public bucket" được check
3. Kiểm tra policies

---

## 📚 Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist

Sau khi setup xong, kiểm tra:

- [ ] Bucket `hrms-files` đã được tạo
- [ ] Bucket được set là public
- [ ] RLS policies đã được tạo (read, upload, delete)
- [ ] Service role key đã được add vào `.env`
- [ ] Backend log hiển thị "✅ Supabase Storage initialized"
- [ ] Upload avatar thành công
- [ ] Upload document thành công
- [ ] Delete file thành công
- [ ] URLs hiển thị đúng (Supabase URLs)

---

**Last Updated:** February 6, 2026
**Version:** 1.0.0
