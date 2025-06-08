import React, { useEffect, useState } from 'react';
import { Carousel, Row, Col, Card, Button, Modal, message, InputNumber, Form, Input, List, Tag, Table } from 'antd';
import axios from 'axios';

const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

function ClientHome() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [cart, setCart] = useState([]); 
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isOrdersModalVisible, setIsOrdersModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailsModalVisible, setIsOrderDetailsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Lấy danh sách sản phẩm
    axios.get('http://localhost:3001/api/products')
      .then(res => {
        const products = res.data.map(p => ({
          ID: p.ID,
          HINHANH: p.HINHANH,
          MASANPHAM: p.MASANPHAM,
          TENSANPHAM: p.TENSANPHAM,
          THUONGHIEU: p.THUONGHIEU,
          LOAISANPHAM: p.LOAISANPHAM,
          GIABAN: p.GIABAN,
          MOTA: p.MOTA,
          SOLUONGTON: p.SOLUONGTON
        }));
        setProducts(products);
        const initialQuantities = {};
        products.forEach(p => { initialQuantities[p.ID] = 1 });
      })
      .catch(err => {
        console.error('Lỗi tải sản phẩm:', err);
        message.error('Không thể tải danh sách sản phẩm');
      });
  }, []);

  useEffect(() => {
    // Lấy lịch sử đơn hàng khi có customerId
    const customerId = localStorage.getItem('customerId');
    console.log('customerId:', customerId);
    
    if (customerId) {
      axios.get(`http://localhost:3001/api/orders/customer?customerId=${customerId}`)
        .then(response => {
          console.log('Response data:', response.data);
          if (Array.isArray(response.data)) {
            setOrders(response.data);
          } else if (response.data && Array.isArray(response.data.orders)) {
            setOrders(response.data.orders);
          } else {
            console.error('Invalid response format:', response.data);
            message.error('Dữ liệu đơn hàng không hợp lệ');
          }
        })
        .catch(error => {
          console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
          message.error('Không thể lấy lịch sử đơn hàng');
        });
    }
  }, []);

  useEffect(() => {
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
    const quantity = orderQuantities[product.ID] || 1;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.ID === product.ID);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, product.SOLUONGTON);
        return prevCart.map(item =>
          item.product.ID === product.ID ? { ...item, quantity: newQuantity } : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
    message.success(`Đã thêm ${quantity} "${product.TENSANPHAM}" vào giỏ hàng`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.ID !== productId));
  };

  const changeCartQuantity = (productId, value) => {
    setCart(prev => prev.map(item =>
      item.product.ID === productId ? { ...item, quantity: value } : item
    ));
  };

  const openOrderModal = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng đang trống!');
      return;
    }
    setIsOrderModalVisible(true);
  };

  const handleOrderSubmit = async (values) => {
    try {
      console.log('Cart:', cart);
      console.log('Order values:', values);
      
      // Kiểm tra xem giỏ hàng có sản phẩm không
      if (cart.length === 0) {
        message.warning('Giỏ hàng đang trống!');
        return;
      }

      // Hiển thị xác nhận trước khi đặt hàng
      const confirm = await Modal.confirm({
        title: 'Xác nhận đơn hàng',
        content: (
          <div>
            <p>Bạn có chắc chắn muốn đặt đơn hàng này không?</p>
            <p>Tổng tiền: {formatPrice(cart.reduce((sum, item) => sum + (item.product.GIABAN || 0) * (item.quantity || 0), 0))}</p>
          </div>
        ),
        okText: 'Đặt hàng',
        cancelText: 'Hủy'
      });

      if (!confirm) {
        return;
      }

      // Ẩn modal đặt hàng trước khi gọi API
      setIsOrderModalVisible(false);
      form.resetFields();

      // Gọi API để tạo đơn hàng
      console.log('Dữ liệu cart trước khi gửi:', cart);
      console.log('Kiểu dữ liệu cart:', typeof cart);
      console.log('Kiểu dữ liệu cart[0]:', cart.length > 0 ? typeof cart[0] : 'undefined');
      
      // Chuẩn bị dữ liệu cart
      const cartData = cart.map(item => ({
        product: {
          ID: String(item.product.ID), // Chuyển đổi thành string
          MASANPHAM: item.product.MASANPHAM,
          TENSANPHAM: item.product.TENSANPHAM,
          GIABAN: Number(item.product.GIABAN),
          SOLUONGTON: Number(item.product.SOLUONGTON)
        },
        quantity: Number(item.quantity)
      }));
      
      console.log('Dữ liệu cart chuẩn bị gửi:', JSON.stringify(cartData, null, 2));
      
      // Gửi dữ liệu với header Content-Type: application/json
      const response = await axios.post('http://localhost:3001/api/orders', {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        cart: cartData
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        message.success('Đơn hàng đã được tạo thành công! Số đơn hàng: ' + response.data.orderId);
        
        // Kiểm tra và lưu customerId
        const customerId = response.data.customerId;
        if (customerId) {
          localStorage.setItem('customerId', customerId);
          console.log('Đã lưu customerId:', customerId);
          // Cập nhật lại danh sách đơn hàng ngay lập tức
          axios.get(`http://localhost:3001/api/orders/customer?customerId=${customerId}`)
            .then(response => {
              setOrders(response.data);
              console.log('Đã cập nhật danh sách đơn hàng:', response.data);
            })
            .catch(error => {
              console.error('Lỗi khi cập nhật danh sách đơn hàng:', error);
              message.error('Không thể cập nhật danh sách đơn hàng');
            });
        } else {
          console.error('customerId không hợp lệ:', response.data);
          message.error('Không thể lưu thông tin khách hàng');
        }

        // Reset cart và các state liên quan
        setCart([]);
        setOrderQuantities({});
        setIsCartVisible(false);
        // Cập nhật lại danh sách sản phẩm
        axios.get('http://localhost:3001/api/products')
          .then(res => {
            setProducts(res.data);
            const initialQuantities = {};
            res.data.forEach(p => initialQuantities[p.ID] = 1);
            setOrderQuantities(initialQuantities);
          })
          .catch(err => {
            console.error('Lỗi khi cập nhật danh sách sản phẩm:', err);
            message.error('Có lỗi khi cập nhật danh sách sản phẩm');
          });
      } else {
        message.error(response.data.error || 'Có lỗi khi tạo đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý đơn hàng:', error);
      message.error('Có lỗi khi xử lý đơn hàng: ' + error.message);
    }
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
        {products.map(product => (
          <Col key={product.ID} xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              cover={
                <img
                  src={product.HINHANH}
                  alt={product.TENSANPHAM}
                  style={{
                    height: 220,
                    objectFit: 'cover',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12
                  }}
                />
              }
            >
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>{product.TENSANPHAM}</h3>
              <p style={{ color: '#cf1322', fontWeight: 'bold', fontSize: 15, margin: '8px 0' }}>
                {formatPrice(product.GIABAN)}
              </p>
              <p style={{ marginBottom: 4 }}><strong>Thương hiệu:</strong> {product.THUONGHIEU}</p>
              <p style={{ marginBottom: 4 }}><strong>Loại:</strong> {product.LOAISANPHAM}</p>
              <p style={{ fontSize: 13, color: '#555', height: 40, overflow: 'hidden' }}>
                {typeof product.MOTA === 'object' ? JSON.stringify(product.MOTA) : product.MOTA}
              </p>
              <p style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Số lượng:</strong> {product.SOLUONGTON}
              </p>
              <InputNumber
                min={1}
                max={product.SOLUONGTON}
                value={orderQuantities[product.ID] || 1}
                onChange={(value) => handleQuantityChange(product.ID, value)}
                style={{ width: '100%', marginBottom: 10 }}
              />
              <Button
                type="primary"
                block
                size="large"
                onClick={() => addToCart(product)}
                disabled={product.SOLUONGTON <= 0}
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
                  max={product.SOLUONGTON}
                  value={quantity}
                  onChange={(value) => changeCartQuantity(product.ID, value)}
                  style={{ width: 80 }}
                />,
                <Button danger onClick={() => removeFromCart(product.ID)}>Xóa</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<img src={product.HINHANH} alt={product.TENSANPHAM} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />}
                title={product.TENSANPHAM}
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Tag color="blue">{product.THUONGHIEU}</Tag>
                      <Tag color="green">{product.LOAISANPHAM}</Tag>
                    </div>
                    <div style={{ marginBottom: 4, color: '#cf1322', fontWeight: 'bold' }}>
                      Giá: {formatPrice(product.GIABAN)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                      {product.MOTA}
                    </div>
                  </div>
                }
              />
              <div style={{ marginTop: 8, color: '#cf1322', fontWeight: 'bold' }}>
                {formatPrice(quantity * product.GIABAN)}
              </div>
            </List.Item>
          )}
        />
        <div style={{ marginTop: 10, fontWeight: 'bold', textAlign: 'right', color: '#cf1322' }}>
          Tổng tiền: {formatPrice(cart.reduce((sum, item) => sum + (item.product.GIABAN || 0) * (item.quantity || 0), 0))}
        </div>
      </Modal>

      <Modal
        title="Thông tin đặt hàng"
        open={isOrderModalVisible}
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

      {/* Modal hiển thị lịch sử đơn hàng */}
      <Modal
        title="Lịch sử đơn hàng"
        open={isOrdersModalVisible}
        onCancel={() => setIsOrdersModalVisible(false)}
        width={800}
        footer={null}
      >
        <Table
          columns={[
            {
              title: 'Mã Đơn Hàng',
              dataIndex: 'MA_DON_HANG',
              key: 'MA_DON_HANG',
              width: 150
            },
            {
              title: 'Ngày Đặt',
              dataIndex: 'CREATED_AT',
              key: 'CREATED_AT',
              width: 150,
              render: (date) => new Date(date).toLocaleDateString('vi-VN')
            },
            {
              title: 'Họ Tên',
              dataIndex: 'HO_TEN',
              key: 'HO_TEN',
              width: 150
            },
            {
              title: 'Số Điện Thoại',
              dataIndex: 'SO_DIEN_THOAI',
              key: 'SO_DIEN_THOAI',
              width: 150
            },
            {
              title: 'Địa Chỉ',
              dataIndex: 'DIA_CHI',
              key: 'DIA_CHI',
              width: 200
            },
            {
              title: 'Tổng Tiền',
              dataIndex: 'TOTAL_AMOUNT',
              key: 'TOTAL_AMOUNT',
              width: 150,
              render: (amount) => formatPrice(amount)
            },
            {
              title: 'Trạng Thái',
              dataIndex: 'STATUS',
              key: 'STATUS',
              width: 100,
              render: (status) => (
                <Tag color={status === 'PENDING' ? 'blue' : status === 'DELIVERED' ? 'green' : 'red'}>
                  {status === 'PENDING' ? 'Đang xử lý' : status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}
                </Tag>
              )
            },
            {
              title: 'Chi Tiết',
              key: 'action',
              width: 100,
              render: (record) => (
                <Button type="link" onClick={() => showOrderDetails(record)}>
                  Xem chi tiết
                </Button>
              )
            }
          ]}
          dataSource={orders}
          pagination={{ pageSize: 5 }}
          rowKey="MA_DON_HANG"
        />
      </Modal>
      {/* Button xem lịch sử đơn hàng */}
      <Button
        type="primary"
        style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1000 }}
        onClick={() => setIsOrdersModalVisible(true)}
      >
        Lịch sử đơn hàng
      </Button>

      {/* Modal chi tiết đơn hàng */}
      <Modal
        title={`Chi Tiết Đơn Hàng ${selectedOrder?.MA_DON_HANG}`}
        visible={isOrderDetailsModalVisible}
        onCancel={() => {
          setIsOrderDetailsModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3>Thông tin khách hàng</h3>
              <p><strong>Họ tên:</strong> {selectedOrder.HO_TEN}</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.DIA_CHI}</p>
              <p><strong>Số điện thoại:</strong> {selectedOrder.SO_DIEN_THOAI}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3>Chi tiết đơn hàng</h3>
              <Table
                dataSource={getOrderDetails(selectedOrder)}
                columns={[
                  {
                    title: 'Sản phẩm',
                    dataIndex: 'product',
                    key: 'product',
                    render: (product) => product?.TENSANPHAM
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'GIABAN',
                    key: 'GIABAN',
                    render: (price) => formatPrice(price)
                  },
                  {
                    title: 'Số lượng',
                    dataIndex: 'SO_LUONG',
                    key: 'SO_LUONG'
                  },
                  {
                    title: 'Thành tiền',
                    key: 'total',
                    render: (record) => formatPrice(record.GIABAN * record.SO_LUONG)
                  }
                ]}
              />
            </div>

            <div>
              <h3>Tổng cộng:</h3>
              <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                {formatPrice(selectedOrder.TOTAL_AMOUNT)}
              </p>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default ClientHome;