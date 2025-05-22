import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber } from 'antd';
import axios from 'axios';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:3001/api/products');
    setProducts(res.data);
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3001/api/products/${id}`)
      .then(() => fetchProducts());
  };

  const handleEdit = (record) => {
    setEditProduct(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editProduct && editProduct.id) {
        axios.put(`http://localhost:3001/api/products/${editProduct.id}`, values)
          .then(() => {
            fetchProducts();
            setIsModalOpen(false);
          });
      } else {
        axios.post(`http://localhost:3001/api/products`, values)
          .then(() => {
            fetchProducts();
            setIsModalOpen(false);
          });
      }
    });
  };

  return (
    <>
      <Button type="primary" onClick={() => {
        setEditProduct(null);
        form.resetFields();
        setIsModalOpen(true);
      }}>Thêm sản phẩm</Button>

      <Table
  dataSource={products}
  rowKey="id"
  style={{ marginTop: 20 }}
  scroll={{ x: 'max-content' }} 
>
  <Table.Column title="Hình ảnh" dataIndex="HinhAnh" render={url => <img src={url} alt="" style={{ width: 50 }} />} />
  <Table.Column title="Mã sản phẩm" dataIndex="MaSanPham" responsive={['xs', 'sm', 'md', 'lg', 'xl']} />
  <Table.Column title="Tên sản phẩm" dataIndex="TenSanPham" responsive={['xs', 'sm', 'md', 'lg', 'xl']} />
  <Table.Column title="Thương hiệu" dataIndex="ThuongHieu" responsive={['sm', 'md', 'lg', 'xl']} />
  <Table.Column title="Loại sản phẩm" dataIndex="LoaiSanPham" responsive={['md', 'lg', 'xl']} />
  <Table.Column title="Giá bán" dataIndex="GiaBan" render={price => `${price} đ`} responsive={['xs', 'sm', 'md', 'lg', 'xl']} />
  <Table.Column title="Mô tả" dataIndex="MoTa" responsive={['lg', 'xl']} />
  <Table.Column title="Số lượng tồn" dataIndex="SoLuongTon" responsive={['sm', 'md', 'lg', 'xl']} />
  <Table.Column
    title="Hành động"
    render={(record) => (
      <>
        <Button onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>Sửa</Button>
        <Button danger onClick={() => handleDelete(record.id)}>Xóa</Button>
      </>
    )}
    fixed="right"
  />
</Table>


      <Modal
        title={editProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        visible={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="HinhAnh" label="Hình ảnh URL" rules={[{ required: true, message: 'Vui lòng nhập URL ảnh' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="MaSanPham" label="Mã sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="TenSanPham" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="ThuongHieu" label="Thương hiệu" rules={[{ required: true, message: 'Vui lòng nhập thương hiệu' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="LoaiSanPham" label="Loại sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập loại sản phẩm' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="GiaBan" label="Giá bán" rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item name="MoTa" label="Mô tả">
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="SoLuongTon" label="Số lượng tồn" rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProductList;
