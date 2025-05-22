const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const orders = [];


app.get('/api/products', (req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const newProduct = { id: Date.now(), ...req.body };
  products.push(newProduct);
  res.json(newProduct);
});
app.put('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
  } else res.status(404).send('Không tìm thấy sản phẩm');
});
app.delete('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products.splice(index, 1);
    res.send('Xóa sản phẩm thành công');
  } else res.status(404).send('Không tìm thấy sản phẩm');
});


app.get('/api/banners', (req, res) => res.json(banners));
app.post('/api/banners', (req, res) => {
  const newBanner = { id: Date.now(), ...req.body };
  banners.push(newBanner);
  res.json(newBanner);
});
app.put('/api/banners/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = banners.findIndex(b => b.id === id);
  if (index !== -1) {
    banners[index] = { ...banners[index], ...req.body };
    res.json(banners[index]);
  } else res.status(404).send('Không tìm thấy banner');
});
app.delete('/api/banners/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = banners.findIndex(b => b.id === id);
  if (index !== -1) {
    banners.splice(index, 1);
    res.send('Xoá banner thành công');
  } else res.status(404).send('Không tìm thấy banner');
});


app.get('/api/orders', (req, res) => {
  res.json(orders);
});


app.post('/api/orders', (req, res) => {
  const order = req.body;

  if (!order.MaDonHang || !order.MaKhachHang) {
    return res.status(400).json({ message: 'Thông tin đơn hàng không đầy đủ' });
  }

  orders.push(order);
  
  res.status(201).json({
    message: 'Đặt hàng thành công!',
    order,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
