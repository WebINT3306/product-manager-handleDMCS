[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/sg_x-93A)
# Bài tập: Quản lý Danh sách Sản phẩm

Bạn cần xây dựng trang web **quản lý sản phẩm** bằng HTML, CSS và JavaScript thuần.

## 1. File cần nộp

Bạn chỉnh sửa đúng **một file** ở thư mục gốc:

- `index.html`

Toàn bộ HTML, CSS và JavaScript phải nằm **trong một file duy nhất** này. Viết JavaScript trong thẻ `<script>` ở cuối `<body>`.

File `products.json` đã được cung cấp sẵn — **không chỉnh sửa file này**.

---

## 2. Mô tả ứng dụng

Trang web hiển thị danh sách sản phẩm được nạp từ `products.json` qua AJAX, cho phép sắp xếp theo tên và thêm sản phẩm mới qua form.

### Dữ liệu sản phẩm (`products.json`)

Mỗi sản phẩm có cấu trúc:

```json
{ "id": 1, "name": "Ten san pham", "category": "Danh muc", "price": 8500000, "quantity": 5 }
```

---

## 3. Yêu cầu giao diện

### 3.1 Bảng sản phẩm

Trang phải có bảng với **đúng `id`**:

| Thành phần | `id` bắt buộc | Ghi chú |
|---|---|---|
| Bảng sản phẩm | `product-table` | Thẻ `<table>` |

Bảng phải có:
- Thẻ `<thead>` với hàng tiêu đề
- Thẻ `<tbody>` chứa các hàng dữ liệu
- Các cột: **STT**, **Tên sản phẩm**, **Danh mục**, **Đơn giá**, **Số lượng**

Tiêu đề cột **Tên sản phẩm** (`<th>`) phải chứa chữ `"tên"` hoặc `"ten"` hoặc `"name"` (không phân biệt hoa thường) để autograder nhận dạng.

### 3.2 Form thêm sản phẩm

| Thành phần | `id` bắt buộc | Loại thẻ |
|---|---|---|
| Ô nhập tên | `input-name` | `<input>` |
| Ô nhập danh mục | `input-category` | `<input>` (tuỳ chọn nhưng nên có) |
| Ô nhập đơn giá | `input-price` | `<input type="number">` |
| Ô nhập số lượng | `input-quantity` | `<input type="number">` |
| Nút thêm | `btn-add` | `<button>` |

---

## 4. Yêu cầu chức năng

### 4.1 Nạp dữ liệu qua AJAX

- Khi trang tải xong, dùng `XMLHttpRequest` để đọc file `products.json`
- Sau khi nhận dữ liệu (khi `readyState === 4` và `status === 200`): parse JSON và render từng sản phẩm thành hàng `<tr>` trong `<tbody>` của `#product-table`

```javascript
// Gợi ý khung code
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const products = JSON.parse(xhr.responseText);
    // render ra bảng...
  }
};
xhr.open('GET', 'products.json');
xhr.send();
```

### 4.2 Sắp xếp bảng

- Click vào tiêu đề cột **Tên sản phẩm**: sắp xếp các hàng **tăng dần** theo tên (lần 1) rồi **giảm dần** (lần 2), toggle qua lại mỗi lần click
- Hiển thị ký hiệu `▲` hoặc `▼` trên tiêu đề để người dùng biết chiều sắp xếp hiện tại

### 4.3 Thêm sản phẩm

- Khi nhấn `#btn-add`:
  - Đọc giá trị từ `#input-name`, `#input-price`, `#input-quantity` (và `#input-category` nếu có)
  - Thêm **một hàng mới** vào `<tbody>` của `#product-table` mà **không reload trang**
  - Reset lại các ô nhập về rỗng

**Validation tối thiểu (khuyến khích):**
- Tên sản phẩm: không được rỗng, ít nhất 3 ký tự
- Đơn giá: phải là số dương
- Số lượng: phải là số nguyên ≥ 1

### 4.4 Giao diện bảng (khuyến khích)

- Màu nền xen kẽ giữa hàng chẵn và hàng lẻ
- Highlight (đổi màu nền) khi hover vào hàng

---

## 5. Lưu ý kỹ thuật

> **Quan trọng:** Trang phải chạy qua **local server** (ví dụ VS Code Live Server) thì AJAX mới hoạt động. Không mở file bằng `file://` trực tiếp.

- Không dùng thư viện ngoài (jQuery, Bootstrap JS, Axios, v.v.)
- Không cần file CSS hay JS riêng — viết tất cả trong `index.html`
- Autograder sẽ **mock XMLHttpRequest** khi chạm — bạn chỉ cần viết đúng logic

---

