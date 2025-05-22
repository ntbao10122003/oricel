import React, { useEffect, useState } from 'react';
import { Table, Button, Input, message, Popconfirm } from 'antd';

function BannerList() {
  const [banners, setBanners] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editedBanners, setEditedBanners] = useState({});

  const fetchBanners = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/banners');
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      message.error('Lấy danh sách banner thất bại');
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const handleDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await fetch('http://localhost:3001/api/banners/delete-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedRowKeys.map(id => ({ id }))),
      });
      message.success('Xoá thành công');
      setSelectedRowKeys([]);
      fetchBanners();
    } catch {
      message.error('Xoá thất bại');
    }
  };

  const handleUpdateMultiple = async () => {
    const updates = selectedRowKeys
      .map(id => ({
        id,
        ...editedBanners[id],
      }))
      .filter(b => b.title); 

    if (updates.length === 0) {
      message.warning('Không có dữ liệu cập nhật');
      return;
    }

    try {
      await fetch('http://localhost:3001/api/banners/update-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      message.success('Cập nhật thành công');
      setEditedBanners({});
      fetchBanners();
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (text, record) => (
        <Input
          defaultValue={text}
          onChange={(e) => {
            const newTitle = e.target.value;
            setEditedBanners(prev => ({
              ...prev,
              [record.id]: {
                ...prev[record.id],
                title: newTitle,
              },
            }));
          }}
        />
      ),
    },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      render: (src) =>
        src ? (
          <img src={src} alt="banner" style={{ width: 100, height: 'auto' }} />
        ) : (
          <span>Chưa có ảnh</span>
        ),
    },
  ];

  return (
    <div>
      <h2>Danh sách Banner</h2>

      <div style={{ marginBottom: 16 }}>
        <Popconfirm
          title="Bạn có chắc chắn xoá?"
          onConfirm={handleDeleteMultiple}
          okText="Xoá"
          cancelText="Huỷ"
        >
          <Button danger disabled={selectedRowKeys.length === 0}>
            Xoá nhiều
          </Button>
        </Popconfirm>

        <Button
          type="primary"
          style={{ marginLeft: 8 }}
          onClick={handleUpdateMultiple}
          disabled={selectedRowKeys.length === 0}
        >
          Cập nhật nhiều
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={banners}
        columns={columns}
        rowSelection={rowSelection}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}

export default BannerList;
