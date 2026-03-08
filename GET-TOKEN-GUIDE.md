# Hướng dẫn lấy JWT Token để test

## Cách 1: Từ Browser (Dễ nhất)

1. Mở trình duyệt và truy cập: http://localhost:3000
2. Đăng nhập với tài khoản HR hoặc Admin
3. Sau khi đăng nhập thành công, nhấn F12 để mở DevTools
4. Chọn tab "Application" (Chrome) hoặc "Storage" (Firefox)
5. Trong sidebar bên trái, chọn "Local Storage" → "http://localhost:3000"
6. Tìm key có tên "token" hoặc "access_token"
7. Copy giá trị của token (chuỗi dài bắt đầu bằng "eyJ...")

## Cách 2: Từ API (Dùng curl)

```bash
# Login và lấy token
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@company.com\",\"password\":\"your_password\"}"
```

Response sẽ có dạng:
```json