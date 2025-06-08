# Oricel - Quản lý đơn hàng và sản phẩm

## Mô tả dự án
Oricel là một hệ thống quản lý đơn hàng và sản phẩm, bao gồm cả frontend và backend, sử dụng Oracle Database để lưu trữ dữ liệu.

## Yêu cầu hệ thống

### Backend
- Node.js >= 14.x
- Oracle Database 19c
- npm hoặc yarn

### Frontend
- Node.js >= 14.x
- npm hoặc yarn
- React.js

## Cấu trúc dự án
```
oricel/
├── frontend/         # Frontend React application
└── backend/          # Backend Node.js application
```

## Cài đặt và chạy dự án

### 1. Cài đặt Oracle Database
1. Tải và cài đặt Oracle Database 19c từ [trang web Oracle](https://www.oracle.com/database/technologies/xe-downloads.html)
2. Trong quá trình cài đặt, sử dụng thông tin sau:
   - Username: SYSTEM
   - Password: abc123
   - Port: 1521
   - Service name: orcl

### 2. Cấu hình Oracle Database
1. Import dump file:
```bash
cd backend
sqlplus SYSTEM/abc123@//localhost:1521/orcl
@import.sql
```

### 3. Cài đặt và chạy Backend
1. Trong thư mục backend:
```bash
cd backend
npm install
node server.js
```
Backend sẽ chạy trên port 3001

### 4. Cài đặt và chạy Frontend
1. Trong thư mục frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy trên port 5173

## Cách sử dụng

### Đăng nhập
- Admin: 
  - Username: admin
  - Password: admin123

- Khách hàng:
  - Username: customer
  - Password: customer123

### Các tính năng chính
1. Quản lý sản phẩm:
   - Xem danh sách sản phẩm
   - Thêm mới sản phẩm
   - Sửa thông tin sản phẩm
   - Xóa sản phẩm

2. Quản lý đơn hàng:
   - Xem danh sách đơn hàng
   - Xem chi tiết đơn hàng
   - Quản lý trạng thái đơn hàng

3. Quản lý khách hàng:
   - Xem danh sách khách hàng
   - Xem lịch sử mua hàng

## Lưu ý
- Đảm bảo Oracle Database đang chạy trước khi khởi động backend
- Kiểm tra cấu hình kết nối trong file `backend/db.js`
- Đảm bảo các port không bị chiếm dụng

## Hướng dẫn chạy và import database

### 1. Cấu hình Oracle Database
```javascript
const dbConfig = {
  user: 'SYSTEM',
  password: 'abc123',
  connectString: 'DESKTOP-CJ9CU8T.lan:1521/orcl.lan'
};
```

### 2. Import Database
1. Kiểm tra kết nối:
```bash
sqlplus SYSTEM/abc123@//DESKTOP-CJ9CU8T.lan:1521/orcl.lan
```

2. Import dữ liệu:
```bash
@import.sql
```

### 3. Kiểm tra hệ thống
- Backend: http://localhost:3001/api/products
- Frontend: http://localhost:5173
- Kiểm tra log trong terminal để xem lỗi (nếu có)

