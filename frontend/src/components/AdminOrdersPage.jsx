import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import axios from 'axios';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/orders');
      const data = await response.json();
      
      // Chuyển đổi dữ liệu để phù hợp với Ant Design Table
      const formattedOrders = data.map(order => ({
        MA_DON_HANG: order.MA_DON_HANG,
        MA_KHACH_HANG: order.MA_KHACH_HANG,
        HO_TEN: order.HO_TEN,
        DIA_CHI: order.DIA_CHI,
        SO_DIEN_THOAI: order.SO_DIEN_THOAI,
        CREATED_AT: new Date(order.CREATED_AT).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        TOTAL_AMOUNT: Number(order.TOTAL_AMOUNT),
        STATUS: order.STATUS,
        TONG_SO_LUONG: Number(order.TONG_SO_LUONG),
        orderDetails: order.orderDetails || []
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Bảng con hiển thị chi tiết sản phẩm trong đơn hàng
  const expandedRowRender = (order) => {
    const detailColumns = [
      { title: 'Mã Sản Phẩm', dataIndex: 'MASANPHAM', key: 'MASANPHAM' },
      { title: 'Tên Sản Phẩm', dataIndex: 'TENSANPHAM', key: 'TENSANPHAM' },
      { title: 'Số Lượng', dataIndex: 'SOLUONG', key: 'SOLUONG' },
      {
        title: 'Đơn Giá',
        dataIndex: 'GIA',
        key: 'GIA',
        render: (text) => formatPrice(text),
      },
    ];

    return (
      <Table
        columns={detailColumns}
        dataSource={order.orderDetails}
        pagination={false}
        rowKey="MASANPHAM"
      />
    );
  };



const columns = [
  { title: 'Mã Đơn Hàng', dataIndex: 'MA_DON_HANG', key: 'MA_DON_HANG' },
  { title: 'Tên Khách Hàng', dataIndex: 'HO_TEN', key: 'HO_TEN' },
  { title: 'Mã Khách Hàng', dataIndex: 'MA_KHACH_HANG', key: 'MA_KHACH_HANG' },
  { title: 'Địa Chỉ', dataIndex: 'DIA_CHI', key: 'DIA_CHI' },
  { title: 'Số Điện Thoại', dataIndex: 'SO_DIEN_THOAI', key: 'SO_DIEN_THOAI' },
  { 
    title: 'Ngày Đặt Hàng', 
    dataIndex: 'CREATED_AT',
    key: 'CREATED_AT'
  },
  { 
    title: 'Tổng Tiền', 
    dataIndex: 'TOTAL_AMOUNT',
    key: 'TOTAL_AMOUNT',
    render: (text) => formatPrice(text)
  },
  { title: 'Trạng Thái', dataIndex: 'STATUS', key: 'STATUS' },
  { 
    title: 'Tổng Số Lượng', 
    dataIndex: 'TONG_SO_LUONG',
    key: 'TONG_SO_LUONG'
  }
];

const deleteAllOrders = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả đơn hàng không?')) {
      try {
        const response = await fetch('http://localhost:3001/api/orders', {
          method: 'DELETE'
        });
        if (response.ok) {
          message.success('Đã xóa tất cả đơn hàng thành công');
          fetchOrders(); // Cập nhật lại danh sách
        } else {
          message.error('Không thể xóa đơn hàng');
        }
      } catch (error) {
        console.error('Error deleting orders:', error);
        message.error('Lỗi khi xóa đơn hàng');
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý đơn hàng</h2>
     <Table
        dataSource={orders}
        columns={columns}
        rowKey="MA_DON_HANG"
        expandable={{ expandedRowRender }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}

export default AdminOrdersPage;
