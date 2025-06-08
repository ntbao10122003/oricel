import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm } from 'antd';
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
        columns={[
          {
            title: 'ID',
            dataIndex: 'ID',
            key: 'ID',
          },
          {
            title: 'Hình ảnh',
            dataIndex: 'HINHANH',
            key: 'HINHANH',
            render: (text) => (
              <img src={text} alt="Product" style={{ width: 50, height: 50 }} />
            )
          },
          {
            title: 'Mã sản phẩm',
            dataIndex: 'MASANPHAM',
            key: 'MASANPHAM',
          },
          {
            title: 'Tên sản phẩm',
            dataIndex: 'TENSANPHAM',
            key: 'TENSANPHAM',
          },
          {
            title: 'Thương hiệu',
            dataIndex: 'THUONGHIEU',
            key: 'THUONGHIEU',
          },
          {
            title: 'Loại sản phẩm',
            dataIndex: 'LOAISANPHAM',
            key: 'LOAISANPHAM',
          },
          {
            title: 'Giá bán',
            dataIndex: 'GIABAN',
            key: 'GIABAN',
            render: (text) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(text)
          },
          {
            title: 'Mô tả',
            dataIndex: 'MOTA',
            key: 'MOTA',
            render: (text) => {
              if (typeof text === 'object') {
                return JSON.stringify(text);
              }
              if (text && typeof text === 'string') {
                try {
                  const parsed = JSON.parse(text);
                  return JSON.stringify(parsed);
                } catch {
                  return text;
                }
              }
              return text;
            }
          },
          {
            title: 'Số lượng tồn',
            dataIndex: 'SOLUONGTON',
            key: 'SOLUONGTON',
          },
          {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
              <Space size="middle">
                <Button type="primary" onClick={() => handleEdit(record)}>Sửa</Button>
                <Popconfirm
                  title="Bạn có chắc muốn xóa sản phẩm này?"
                  onConfirm={() => handleDelete(record.ID)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button type="danger">Xóa</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={products}
        rowKey="ID"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editProduct || {} }
        >
          <Form.Item
            name="ID"
            label="ID"
            hidden={true}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="HINHANH"
            label="Hình ảnh"
            rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="MASANPHAM"
            label="Mã sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="TENSANPHAM"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="THUONGHIEU"
            label="Thương hiệu"
            rules={[{ required: true, message: 'Vui lòng nhập thương hiệu' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="LOAISANPHAM"
            label="Loại sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập loại sản phẩm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="GIABAN"
            label="Giá bán"
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="MOTA"
            label="Mô tả"
          >
            <Input.TextArea 
              onChange={(e) => {
                const value = e.target.value;
                form.setFieldsValue({ MOTA: value });
              }}
              value={form.getFieldValue('MOTA') || ''}
            />
          </Form.Item>
          <Form.Item
            name="SOLUONGTON"
            label="Số lượng tồn"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProductList;
