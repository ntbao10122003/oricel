import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import axios from 'axios';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/orders')
      .then(res => setOrders(res.data))
      .catch(err => {
        console.error('Lỗi tải đơn hàng:', err);
        message.error('Không thể tải đơn hàng!');
      });
  }, []);

  // Bảng con hiển thị chi tiết sản phẩm trong đơn hàng
  const expandedRowRender = (order) => {
    const detailColumns = [
      { title: 'Mã Sản Phẩm', dataIndex: 'MaSanPham', key: 'MaSanPham' },
      { title: 'Tên Sản Phẩm', dataIndex: 'TenSanPham', key: 'TenSanPham' },
      { title: 'Số Lượng', dataIndex: 'SoLuong', key: 'SoLuong' },
      { 
        title: 'Đơn Giá', 
        dataIndex: 'DonGia', 
        key: 'DonGia',
        render: (text) => formatPrice(text),
      }
    ];

    return (
      <Table
        columns={detailColumns}
        dataSource={order.Items}
        pagination={false}
        rowKey="MaSanPham"
      />
    );
  };

  const columns = [
    { title: 'Mã Đơn Hàng', dataIndex: 'MaDonHang', key: 'MaDonHang' },
    { title: 'Mã Khách Hàng', dataIndex: 'MaKhachHang', key: 'MaKhachHang' },
    { title: 'Ngày Đặt Hàng', dataIndex: 'NgayDatHang', key: 'NgayDatHang' },
    { 
      title: 'Tổng Tiền', 
      dataIndex: 'TongTien', 
      key: 'TongTien',
      render: (text) => formatPrice(text),
    },
    { title: 'Trạng Thái', dataIndex: 'TrangThai', key: 'TrangThai' },
    {
      title: 'Tổng Số Lượng',
      key: 'SoLuong',
      render: (text, record) => record.Items.reduce((sum, item) => sum + item.SoLuong, 0),
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý đơn hàng</h2>
      <Table
        dataSource={orders}
        columns={columns}
        rowKey="MaDonHang"
        expandable={{ expandedRowRender }}
      />
    </div>
  );
}

export default AdminOrdersPage;
