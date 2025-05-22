import React, { useEffect, useState } from 'react';
import { Carousel, Row, Col, Card, Button, Modal, message, InputNumber, Form, Input, List,Tag  } from 'antd';
import axios from 'axios';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function ClientHome() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [cart, setCart] = useState([]); 
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    axios.get('http://localhost:3001/api/banners')
      .then(res => setBanners(res.data))
      .catch(err => console.error('Lỗi tải banner:', err));

    axios.get('http://localhost:3001/api/products')
      .then(res => {
        setProducts(res.data);
        const initialQuantities = {};
        res.data.forEach(p => { initialQuantities[p.MaSanPham] = 1 });
        setOrderQuantities(initialQuantities);
      })
      .catch(err => console.error('Lỗi tải sản phẩm:', err));
  }, []);

  const handleQuantityChange = (productId, value) => {
    setOrderQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const addToCart = (product) => {
    const quantity = orderQuantities[product.MaSanPham] || 1;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.MaSanPham === product.MaSanPham);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, product.SoLuongTon);
        return prevCart.map(item =>
          item.product.MaSanPham === product.MaSanPham ? { ...item, quantity: newQuantity } : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
    message.success(`Đã thêm ${quantity} "${product.TenSanPham}" vào giỏ hàng`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.MaSanPham !== productId));
  };

  const changeCartQuantity = (productId, value) => {
    setCart(prev => prev.map(item =>
      item.product.MaSanPham === productId ? { ...item, quantity: value } : item
    ));
  };

  const openOrderModal = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng đang trống!');
      return;
    }
    setIsOrderModalVisible(true);
  };

  const handleOrderSubmit = (values) => {
    const total = cart.reduce((sum, item) => sum + item.product.GiaBan * item.quantity, 0);

    const order = {
      MaKhachHang: Date.now(),
      TenKhachHang: values.name,
      Email: values.email,
      SoDienThoai: values.phone,
      DiaChi: values.address,
      MaDonHang: 'DH' + Date.now(),
      NgayDatHang: new Date().toISOString(),
      TongTien: total,
      TrangThai: 'Chờ xử lý',
      Items: cart.map(item => ({
        MaSanPham: item.product.MaSanPham,
        TenSanPham: item.product.TenSanPham,
        SoLuong: item.quantity,
        DonGia: item.product.GiaBan
      }))
    };

    axios.post('http://localhost:3001/api/orders', order)
      .then(() => {
        message.success('Đặt hàng thành công!');
        setIsOrderModalVisible(false);
        setCart([]);
        form.resetFields();
      })
      .catch(() => message.error('Lỗi đặt hàng.'));
  };

  return (
    <div style={{ padding: 20 }}>
      <Carousel autoplay autoplaySpeed={3000} style={{ marginBottom: 30 }}>
        {banners.map((banner, index) => (
          <div key={index}>
            <img src={banner.image} alt={banner.title} style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        ))}
      </Carousel>

      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Sản phẩm nổi bật</h2>
      <Row gutter={[16, 16]}>
  {products.map(p => (
    <Col key={p.MaSanPham} xs={24} sm={12} md={6}>
      <Card
        hoverable
        style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        cover={
          <img
            src={p.HinhAnh}
            alt={p.TenSanPham}
            style={{
              height: 220,
              objectFit: 'cover',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12
            }}
          />
        }
      >
        <h3 style={{ fontWeight: 600, fontSize: 16 }}>{p.TenSanPham}</h3>
        <p style={{ color: '#cf1322', fontWeight: 'bold', fontSize: 15, margin: '8px 0' }}>
          {formatPrice(p.GiaBan)}
        </p>
        <p style={{ marginBottom: 4 }}><strong>Thương hiệu:</strong> {p.ThuongHieu}</p>
        <p style={{ marginBottom: 4 }}><strong>Loại:</strong> {p.LoaiSanPham}</p>
        <p style={{ fontSize: 13, color: '#555', height: 40, overflow: 'hidden' }}>{p.MoTa}</p>
        <p style={{ fontSize: 13, marginBottom: 8 }}>
          <strong>Số lượng:</strong> {p.SoLuongTon}
        </p>
        <InputNumber
          min={1}
          max={p.SoLuongTon}
          value={orderQuantities[p.MaSanPham] || 1}
          onChange={(value) => handleQuantityChange(p.MaSanPham, value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Button
          type="primary"
          block
          size="large"
          onClick={() => addToCart(p)}
          disabled={p.SoLuongTon <= 0}
        >
          Thêm vào giỏ hàng
        </Button>
      </Card>
    </Col>
  ))}
</Row>

      <Button
        type="primary"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        onClick={() => setIsCartVisible(true)}
        disabled={cart.length === 0}
      >
        Giỏ hàng ({cart.length})
      </Button>

      <Modal
        title="Giỏ hàng của bạn"
        visible={isCartVisible}
        onCancel={() => setIsCartVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsCartVisible(false)}>Đóng</Button>,
          <Button key="order" type="primary" onClick={() => { setIsCartVisible(false); openOrderModal(); }}>
            Đặt hàng
          </Button>,
        ]}
      >
        <List
          dataSource={cart}
          renderItem={({ product, quantity }) => (
            <List.Item
              actions={[
                <InputNumber
                  min={1}
                  max={product.SoLuongTon}
                  value={quantity}
                  onChange={(value) => changeCartQuantity(product.MaSanPham, value)}
                  style={{ width: 80 }}
                />,
                <Button danger onClick={() => removeFromCart(product.MaSanPham)}>Xóa</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<img src={product.HinhAnh} alt={product.TenSanPham} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />}
                title={product.TenSanPham}
                description={`Giá: ${formatPrice(product.GiaBan)}`}
              />
              <div>{formatPrice(quantity * product.GiaBan)}</div>
            </List.Item>
          )}
        />
        <div style={{ marginTop: 10, fontWeight: 'bold', textAlign: 'right' }}>
          Tổng tiền: {formatPrice(cart.reduce((sum, item) => sum + item.product.GiaBan * item.quantity, 0))}
        </div>
      </Modal>

      <Modal
        title="Thông tin đặt hàng"
        visible={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleOrderSubmit}>
          <Form.Item name="name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Xác nhận đặt hàng
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ClientHome;
