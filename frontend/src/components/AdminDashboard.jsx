import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ProductList from './ProductList';
import BannerList from './BannerList';
import AdminOrdersPage from './AdminOrdersPage';

import { Button, Flex } from 'antd';

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard Quản lý</h2>
      <Flex gap="small" style={{ marginBottom: 20 }}>
        <Button type="primary">
          <Link to="/admin/products">Quản lý sản phẩm</Link>
        </Button>
        <Button type="primary">
          <Link to="/admin/banner">Quản lý banner</Link>
        </Button>
         <Button type="primary">
          <Link to="/admin/orders">Quản lý đơn hàng</Link>
        </Button>

      </Flex>

      <Routes>
        <Route path="products" element={<ProductList />} />
        <Route path="banner" element={<BannerList />} />
         <Route path="orders" element={<AdminOrdersPage />} /> {/* 🆕 */}

      </Routes>
    </div>
  );
}

export default AdminDashboard;
