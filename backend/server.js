const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const db = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // Add JSON parsing middleware

app.delete('/api/orders', async (req, res) => {
  console.log('Đang xử lý yêu cầu DELETE /api/orders');
  let conn;
  try {
    conn = await db.getConnection();
    console.log('Đã kết nối đến Oracle');

    // Bắt đầu transaction
    await conn.execute('BEGIN TRANSACTION');

    try {
      // Xóa dữ liệu từ ORDER_DETAILS trước
      await conn.execute('DELETE FROM ORDER_DETAILS', [], { autoCommit: false });
      console.log('Đã xóa dữ liệu từ ORDER_DETAILS');

      // Xóa dữ liệu từ ORDERS
      await conn.execute('DELETE FROM ORDERS', [], { autoCommit: false });
      console.log('Đã xóa dữ liệu từ ORDERS');

      // COMMIT transaction
      await conn.commit();
      console.log('Đã commit transaction');

      res.json({ message: 'Đã xóa tất cả đơn hàng thành công' });
    } catch (error) {
      // Nếu có lỗi, rollback transaction
      await conn.rollback();
      console.error('Lỗi trong transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi xóa đơn hàng:', error);
    res.status(500).json({
      error: 'Lỗi khi xóa đơn hàng',
      details: error.message
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (error) {
        console.error('Lỗi khi đóng kết nối:', error);
      }
    }
  }
});

app.get('/api/orders', async (req, res) => {
  console.log('Đang xử lý yêu cầu GET /api/orders');
  let conn;
  try {
    conn = await db.getConnection();
    console.log('Đã kết nối đến Oracle');

    // Lấy danh sách đơn hàng
    const ordersResult = await conn.execute(
      `SELECT o.MA_DON_HANG, o.MA_KHACH_HANG, 
              o.CREATED_AT, o.TOTAL_AMOUNT, o.STATUS,
              o.TONG_SO_LUONG,
              o.HO_TEN, o.DIA_CHI, o.SO_DIEN_THOAI
       FROM ORDERS o
       ORDER BY o.CREATED_AT DESC`,
      [],
      { autoCommit: true }
    );

    // Lấy chi tiết đơn hàng
    const orderDetailsResult = await conn.execute(
      `SELECT od.*, p.TENSANPHAM, p.GIABAN
       FROM ORDER_DETAILS od
       JOIN PRODUCTS p ON od.MASANPHAM = p.MASANPHAM`,
      [],
      { autoCommit: true }
    );

    // Chuyển đổi dữ liệu
    const ordersData = ordersResult.rows.map(order => ({
      MA_DON_HANG: order[0].toString(),
      MA_KHACH_HANG: order[1].toString(),
      CREATED_AT: order[2].toString(),
      TOTAL_AMOUNT: Number(order[3]),
      STATUS: order[4].toString(),
      TONG_SO_LUONG: Number(order[5]), // Sử dụng cột TONG_SO_LUONG từ bảng ORDERS
      HO_TEN: order[6] ? order[6].toString() : null,
      DIA_CHI: order[7] ? order[7].toString() : null,
      SO_DIEN_THOAI: order[8] ? order[8].toString() : null,
      orderDetails: orderDetailsResult.rows
        .filter(row => row[0] === order[0])
        .map(row => ({
          MASANPHAM: row[1].toString(),
          SOLUONG: Number(row[3]),
          GIA: Number(row[4]),
          TENSANPHAM: row[5],
          GIABAN: Number(row[6])
        }))
    }));

    res.json(ordersData);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Lỗi khi đóng kết nối:', err);
      }
    }
  }
});

app.get('/api/orders/customer', async (req, res) => {
  console.log('Đang xử lý yêu cầu GET /api/orders/customer');
  let conn;
  try {
    conn = await db.getConnection();
    console.log('Đã kết nối đến Oracle');

    // Lấy danh sách đơn hàng của khách hàng
    const ordersResult = await conn.execute(
      `SELECT o.*, c.HO_TEN, c.DIA_CHI, c.SO_DIEN_THOAI
       FROM ORDERS o
       JOIN CUSTOMERS c ON o.MA_KHACH_HANG = c.ID
       WHERE c.ID = :customerId
       ORDER BY o.CREATED_AT DESC`,
      { customerId: req.query.customerId },
      { autoCommit: true }
    );

    // Lấy chi tiết đơn hàng
    const orderDetailsResult = await conn.execute(
      `SELECT od.*, p.TENSANPHAM, p.GIABAN
       FROM ORDER_DETAILS od
       JOIN PRODUCTS p ON od.MASANPHAM = p.MASANPHAM`,
      [],
      { autoCommit: true }
    );

    // Tạo map của order details để join vào orders
    const orderDetailsMap = {};
    orderDetails.rows.forEach(row => {
      const orderId = row[0];
      if (!orderDetailsMap[orderId]) {
        orderDetailsMap[orderId] = [];
      }
      orderDetailsMap[orderId].push({
        MASANPHAM: row[1],
        SOLUONG: row[3],
        GIA: row[4],
        TENSANPHAM: row[5],
        GIABAN: row[6]
      });
    });

    // Format dữ liệu orders
    const formattedOrders = ordersResult.rows.map(row => ({
      MA_DON_HANG: row[0],
      MA_KHACH_HANG: row[1],
      HO_TEN: row[6],
      DIA_CHI: row[7],
      SO_DIEN_THOAI: row[8],
      CREATED_AT: row[9],
      STATUS: row[5],
      TOTAL_AMOUNT: row[4],
      orderDetails: orderDetailsMap[row[0]] || []
    }));

    console.log('Danh sách đơn hàng:', formattedOrders);
    res.json(formattedOrders);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đơn hàng của khách hàng:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Lỗi khi đóng kết nối:', err);
      }
    }
  }
});

app.get('/api/products', async (req, res) => {
  console.log('Đang xử lý yêu cầu GET /api/products');
  let conn;
  try {
    console.log('Đang kết nối đến Oracle...');
    conn = await db.getConnection();
    console.log('Kết nối thành công đến Oracle');

    console.log('Đang thực hiện truy vấn...');
    // Sử dụng bind để tối ưu hóa truy vấn
    const result = await conn.execute(
      `SELECT ID, HINHANH, MASANPHAM, TENSANPHAM, THUONGHIEU, LOAISANPHAM, GIABAN, MOTA, SOLUONGTON 
       FROM PRODUCTS`,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchArraySize: 100,
        maxRows: 1000,
        extendedMetaData: true
      }
    );

    console.log('Đã thực hiện xong truy vấn');

    console.log('Số bản ghi trả về:', result.rows.length);
    console.log('Dữ liệu đầu tiên:', result.rows[0]);

    // Xử lý CLOB và tạo mảng kết quả
    const resultArray = result.rows.map(row => ({
      ID: row.ID,
      HINHANH: row.HINHANH,
      MASANPHAM: row.MASANPHAM,
      TENSANPHAM: Buffer.isBuffer(row.TENSANPHAM) ? row.TENSANPHAM.toString('utf8') : row.TENSANPHAM,
      THUONGHIEU: Buffer.isBuffer(row.THUONGHIEU) ? row.THUONGHIEU.toString('utf8') : row.THUONGHIEU,
      LOAISANPHAM: Buffer.isBuffer(row.LOAISANPHAM) ? row.LOAISANPHAM.toString('utf8') : row.LOAISANPHAM,
      GIABAN: row.GIABAN,
      MOTA: Buffer.isBuffer(row.MOTA) ? row.MOTA.toString('utf8') : (typeof row.MOTA === 'object' ? row.MOTA.toString() : row.MOTA),
      SOLUONGTON: row.SOLUONGTON
    }));

    console.log('Đã map xong dữ liệu');
    console.log('Dữ liệu sau khi map:', resultArray[0]);


    // Trả về kết quả dưới dạng JSON
    res.json(resultArray);
    console.log('Đã gửi phản hồi về client');

  } catch (err) {
    console.error('Lỗi truy vấn sản phẩm:', err);
    console.error('Loại lỗi:', typeof err);
    console.error('Thông báo lỗi:', err.message);
    console.error('Stack trace:', err.stack);

    // Thêm thông tin lỗi chi tiết vào phản hồi
    res.status(500).send(JSON.stringify({
      error: 'Lỗi truy vấn sản phẩm',
      details: err.message,
      type: typeof err,
      stack: err.stack
    }));
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log('Đã đóng kết nối');
      } catch (e) {
        console.error('Lỗi đóng kết nối:', e);
      }
    }
  }
});

app.get('/api/check-products', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();

    // Kiểm tra xem bảng products có tồn tại không
    const checkTable = await conn.execute(
      `SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = 'PRODUCTS'`
    );

    if (checkTable.rows[0][0] === 0) {
      res.json({
        exists: false,
        message: 'Bảng PRODUCTS không tồn tại trong cơ sở dữ liệu'
      });
      return;
    }

    // Lấy cấu trúc bảng
    const tableInfo = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
       FROM USER_TAB_COLUMNS 
       WHERE TABLE_NAME = 'PRODUCTS'`
    );

    // Lấy số lượng bản ghi
    const recordCount = await conn.execute(
      `SELECT COUNT(*) FROM PRODUCTS`
    );

    res.json({
      exists: true,
      columns: tableInfo.rows,
      recordCount: recordCount.rows[0][0]
    });

  } catch (err) {
    console.error('Lỗi kiểm tra bảng products:', err);
    res.status(500).send(JSON.stringify({
      error: 'Lỗi kiểm tra bảng products',
      details: err.message
    }));
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { console.error(e); }
    }
  }
});

app.post('/api/products', async (req, res) => {
  console.log('Đang xử lý yêu cầu POST /api/products');
  console.log('Dữ liệu nhận được:', req.body);

  let conn;
  try {
    conn = await db.getConnection();
    console.log('Đã kết nối đến Oracle');

    // Kiểm tra xem tất cả các trường bắt buộc có không
    const requiredFields = ['HINHANH', 'MASANPHAM', 'TENSANPHAM', 'THUONGHIEU', 'LOAISANPHAM', 'GIABAN', 'MOTA', 'SOLUONGTON'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Dữ liệu không đầy đủ',
        missing: missingFields
      });
    }

    try {
      // Thêm sản phẩm mới
      const result = await conn.execute(
        `BEGIN
          INSERT INTO PRODUCTS (ID, HINHANH, MASANPHAM, TENSANPHAM, THUONGHIEU, LOAISANPHAM, GIABAN, MOTA, SOLUONGTON)
          VALUES (PRODUCTS_SEQ.NEXTVAL, :HINHANH, :MASANPHAM, :TENSANPHAM, :THUONGHIEU, :LOAISANPHAM, :GIABAN, :MOTA, :SOLUONGTON);
        END;`,
        {
          HINHANH: req.body.HINHANH,
          MASANPHAM: req.body.MASANPHAM,
          TENSANPHAM: req.body.TENSANPHAM,
          THUONGHIEU: req.body.THUONGHIEU,
          LOAISANPHAM: req.body.LOAISANPHAM,
          GIABAN: req.body.GIABAN,
          MOTA: req.body.MOTA,
          SOLUONGTON: req.body.SOLUONGTON
        },
        { autoCommit: true }
      );

      console.log('Kết quả insert:', result);
      console.log('Số hàng bị ảnh hưởng:', result.rowsAffected);

      // COMMIT transaction
      await conn.commit();

      // Sử dụng sequence để lấy ID mới
      const idResult = await conn.execute(
        `SELECT PRODUCTS_SEQ.CURRVAL FROM DUAL`
      );
      const newId = idResult.rows[0][0];
      console.log('ID mới:', newId);

      res.status(201).json({
        message: 'Sản phẩm đã được tạo thành công',
        id: newId
      });

    } catch (err) {
      await conn.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Lỗi thêm sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi thêm sản phẩm', details: err.message });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Lỗi khi đóng kết nối:', err);
      }
    }
  }
});

app.put('/api/products/:id', async (req, res) => {
  console.log('Đang xử lý yêu cầu PUT /api/products/:id');
  let conn;
  try {
    conn = await db.getConnection();

    const { HINHANH, MASANPHAM, TENSANPHAM, THUONGHIEU, LOAISANPHAM, GIABAN, MOTA, SOLUONGTON } = req.body;
    const id = req.params.id;

    const result = await conn.execute(
      `UPDATE PRODUCTS SET 
         HINHANH = :HINHANH,
         MASANPHAM = :MASANPHAM,
         TENSANPHAM = :TENSANPHAM,
         THUONGHIEU = :THUONGHIEU,
         LOAISANPHAM = :LOAISANPHAM,
         GIABAN = :GIABAN,
         MOTA = :MOTA,
         SOLUONGTON = :SOLUONGTON
       WHERE ID = :ID`,
      {
        HINHANH: { val: HINHANH, type: oracledb.STRING },
        MASANPHAM: { val: MASANPHAM, type: oracledb.STRING },
        TENSANPHAM: { val: TENSANPHAM, type: oracledb.STRING },
        THUONGHIEU: { val: THUONGHIEU, type: oracledb.STRING },
        LOAISANPHAM: { val: LOAISANPHAM, type: oracledb.STRING },
        GIABAN: { val: GIABAN, type: oracledb.NUMBER },
        MOTA: { val: MOTA, type: oracledb.CLOB },
        SOLUONGTON: { val: SOLUONGTON, type: oracledb.NUMBER },
        ID: { val: id, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    } else {
      res.json({
        message: 'Sản phẩm đã được cập nhật thành công',
        affectedRows: result.rowsAffected
      });
    }
  } catch (err) {
    console.error('Lỗi cập nhật sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi cập nhật sản phẩm', details: err.message });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { console.error(e); }
    }
  }
});

app.post('/api/orders', async (req, res) => {
  console.log('Đang xử lý yêu cầu POST /api/orders');
  console.log('Dữ liệu đơn hàng:', req.body);
  console.log('Kiểu dữ liệu:', typeof req.body);

  try {
    // Kiểm tra xem req.body có phải là object không
    if (typeof req.body !== 'object' || req.body === null) {
      console.error('Lỗi: Dữ liệu không phải là object');
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    // Kiểm tra từng trường
    const { name, email, phone, address, cart } = req.body;
    
    // Lưu trữ thông tin khách hàng
    const hoTen = name;
    const diaChi = address;
    const soDienThoai = phone;

    console.log('Đang xử lý đơn hàng:', { 
      name: typeof name,
      email: typeof email,
      phone: typeof phone,
      address: typeof address,
      cart: typeof cart 
    });

    // Kiểm tra thông tin đơn hàng
    if (!name || !email || !phone || !address || !cart || cart.length === 0) {
      console.error('Lỗi: Thông tin đơn hàng không hợp lệ');
      return res.status(400).json({ error: 'Thông tin đơn hàng không hợp lệ' });
    }

    // Kiểm tra dữ liệu cart
    if (!Array.isArray(cart) || cart.length === 0) {
      console.error('Lỗi: Cart không hợp lệ');
      return res.status(400).json({ error: 'Cart không hợp lệ' });
    }

    // Kiểm tra từng item trong cart
    for (const item of cart) {
      if (!item || typeof item !== 'object' ||
          !item.product || typeof item.product !== 'object' ||
          !item.product.MASANPHAM || typeof item.product.MASANPHAM !== 'string' ||
          !item.quantity || typeof item.quantity !== 'number' ||
          item.quantity <= 0) {
        console.error('Lỗi: Item trong cart không hợp lệ:', item);
        return res.status(400).json({ error: 'Item trong cart không hợp lệ' });
      }

      console.log('Item trong cart:', {
        productCode: typeof item.product.MASANPHAM,
        quantity: typeof item.quantity
      });
    }

    // Lấy danh sách mã sản phẩm từ cart
    const productIds = cart.map(item => item.product.MASANPHAM);
    console.log('Danh sách mã sản phẩm:', productIds);

    let conn;
    try {
      conn = await db.getConnection();
      console.log('Đã kết nối đến Oracle');

      // Kiểm tra cấu trúc bảng CUSTOMERS
      const customersCheck = await conn.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'CUSTOMERS'
      `);
      console.log('Cấu trúc bảng CUSTOMERS:', customersCheck.rows);

      // Kiểm tra cấu trúc bảng ORDERS
      const ordersCheck = await conn.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'ORDERS'
      `);
      console.log('Cấu trúc bảng ORDERS:', ordersCheck.rows);

      // Kiểm tra cấu trúc bảng ORDER_DETAILS
      const orderDetailsCheck = await conn.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'ORDER_DETAILS'
      `);
      console.log('Cấu trúc bảng ORDER_DETAILS:', orderDetailsCheck.rows);

      // Bắt đầu transaction
      console.log('Bắt đầu transaction');
      await conn.execute('SAVEPOINT start_transaction', [], { autoCommit: false });

      // Kiểm tra số lượng tồn kho
      console.log('Bắt đầu kiểm tra tồn kho');
      
      // Kiểm tra từng sản phẩm trong cart
      const stockCheck = await Promise.all(
        cart.map(async (item) => {
          try {
            const result = await conn.execute(
              `SELECT MASANPHAM, SOLUONGTON FROM PRODUCTS WHERE MASANPHAM = :masanpham`,
              { masanpham: item.product.MASANPHAM },
              { autoCommit: false }
            );
            
            if (result.rows.length === 0) {
              throw new Error(`Sản phẩm MASANPHAM=${item.product.MASANPHAM} không tồn tại`);
            }

            const [row] = result.rows;
            console.log('Kết quả kiểm tra tồn kho cho sản phẩm:', {
              masanpham: item.product.MASANPHAM,
              result: result.rows,
              row: row,
              soluongton: row[1]  // Truy cập cột thứ 2 (SOLUONGTON)
            });

            const soluongton = row[1];  // Truy cập cột thứ 2 (SOLUONGTON)
            if (soluongton === undefined) {
              throw new Error(`Không thể lấy số lượng tồn kho cho sản phẩm MASANPHAM=${item.product.MASANPHAM}`);
            }

            console.log('Kiểm tra số lượng cho sản phẩm:', item.product.MASANPHAM, 'cần:', item.quantity, 'có:', soluongton);

            if (item.quantity > soluongton) {
              throw new Error(`Sản phẩm MASANPHAM=${item.product.MASANPHAM} không đủ số lượng`);
            }

            return { masanpham: item.product.MASANPHAM, stock: soluongton };
          } catch (err) {
            console.error('Lỗi khi kiểm tra tồn kho:', err);
            throw err;
          }
        })
      );

      console.log('Kết quả kiểm tra tồn kho:', stockCheck);
      console.log('Tất cả sản phẩm đều đủ số lượng');

      // Kiểm tra xem tất cả sản phẩm có tồn tại không
      const missingProducts = cart.filter(item => 
        !stockCheck.some(stock => stock.masanpham === item.product.MASANPHAM)
      );
      
      if (missingProducts.length > 0) {
        console.error('Có sản phẩm không tồn tại:', missingProducts.map(p => p.product.ID));
        await conn.execute('ROLLBACK TO SAVEPOINT start_transaction', [], { autoCommit: false });
        return res.status(400).json({ 
          error: 'Có sản phẩm không tồn tại trong hệ thống',
          missingProducts: missingProducts.map(p => p.product.ID)
        });
      }

      // Kiểm tra số lượng tồn kho
      const insufficientStock = stockCheck.some(stock => stock.stock < 1);
      if (insufficientStock) {
        await conn.execute('ROLLBACK TO SAVEPOINT start_transaction', [], { autoCommit: false });
        return res.status(400).json({ error: 'Số lượng sản phẩm không đủ' });
      }

      // Tạo mã đơn hàng
      const maDonHang = 'DH' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      console.log('Mã đơn hàng:', maDonHang);

      // Tạo mã khách hàng
      const customerCode = 'KH' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      console.log('Mã khách hàng:', customerCode);
      console.log('Dữ liệu khách hàng:', {
        id: customerCode.toString(),
        hoTen,
        email: email.substring(0, 100),
        soDienThoai: soDienThoai.substring(0, 20),
        diaChi: diaChi.substring(0, 200)
      });

      // Tính tổng tiền và tổng số lượng
      const total = cart.reduce((sum, item) => sum + (item.product.GIABAN || 0) * (item.quantity || 0), 0);
      const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      console.log('Tổng tiền:', total);
      console.log('Tổng số lượng:', totalQuantity);

      // Kiểm tra và thêm khách hàng vào CUSTOMERS
      console.log('Kiểm tra và thêm khách hàng');
      
      // Kiểm tra xem khách hàng có tồn tại không
      try {
        const customer = await conn.execute(
          `SELECT ID FROM CUSTOMERS WHERE ID = :id`,
          { id: customerCode.toString() },
          { autoCommit: false }
        );
        console.log('Kết quả kiểm tra khách hàng:', customer.rows);

        // Nếu khách hàng chưa tồn tại, thêm mới
        if (customer.rows.length === 0) {
          console.log('Thêm khách hàng mới');
          try {
            const result = await conn.execute(
              `INSERT INTO CUSTOMERS (ID, HO_TEN, EMAIL, SO_DIEN_THOAI, DIA_CHI)
               VALUES (:id, :hoTen, :email, :soDienThoai, :diaChi)`,
              {
                id: customerCode.toString(),
                hoTen,
                email: email.substring(0, 100),
                soDienThoai: soDienThoai.substring(0, 20),
                diaChi: diaChi.substring(0, 200)
              },
              { autoCommit: false }
            );
            console.log('Kết quả thêm khách hàng:', result);
          } catch (err) {
            console.error('Lỗi thêm khách hàng:', err);
            throw err;
          }
        } else {
          console.log('Khách hàng đã tồn tại');
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra khách hàng:', err);
        throw err;
      }

      // Thêm đơn hàng vào bảng ORDERS
      console.log('Thêm đơn hàng vào ORDERS');
      try {
        const result = await conn.execute(
          `INSERT INTO ORDERS (
            MA_DON_HANG,
            MA_KHACH_HANG,
            TOTAL_AMOUNT,
            STATUS,
            HO_TEN,
            SO_DIEN_THOAI,
            DIA_CHI,
            CREATED_AT,
            UPDATED_AT,
            TONG_SO_LUONG
          ) VALUES (
            :maDonHang,
            :maKhachHang,
            :total,
            'PENDING',
            :hoTen,
            :soDienThoai,
            :diaChi,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :tongSoLuong
          )`,
          {
            maDonHang: maDonHang.toString(),
            maKhachHang: customerCode.toString(),
            total: Number(total),
            hoTen,
            soDienThoai: soDienThoai.substring(0, 20),
            diaChi: diaChi.substring(0, 200),
            tongSoLuong: Number(totalQuantity)
          }, 
          { autoCommit: false }
        );
        console.log('Kết quả thêm đơn hàng:', result);
      } catch (err) {
        console.error('Lỗi thêm đơn hàng:', err);
        throw err;
      }

      // Thêm chi tiết đơn hàng vào ORDER_DETAILS
      console.log('Thêm chi tiết đơn hàng');

      // Thêm chi tiết đơn hàng vào ORDER_DETAILS
      console.log('Thêm chi tiết đơn hàng');
      for (const item of cart) {
        try {
          const result = await conn.execute(
            `INSERT INTO ORDER_DETAILS (
              MA_DON_HANG,
              MASANPHAM,
              ID,
              SOLUONG,
              GIA
            ) VALUES (
              :maDonHang,
              :masanpham,
              :id,
              :soluong,
              :gia
            )`,
            {
              maDonHang: maDonHang.toString(),
              masanpham: item.product.MASANPHAM,  // Thêm MASANPHAM
              id: item.product.ID.toString(),
              soluong: item.quantity,
              gia: item.product.GIABAN
            },
            { autoCommit: false }
          );
          console.log('Kết quả thêm chi tiết đơn hàng:', result);
        } catch (err) {
          console.error('Lỗi thêm chi tiết đơn hàng:', err);
          throw err;
        }
      }
      console.log('Đã thêm chi tiết đơn hàng');

      // COMMIT transaction
      await conn.commit();
      console.log('Đã commit transaction');

      res.json({
        success: true,
        message: 'Đơn hàng đã được tạo thành công',
        orderId: maDonHang,
        customerId: customerCode.toString(),
        total: total
      });
      console.log('Trả về response:', {
        success: true,
        message: 'Đơn hàng đã được tạo thành công',
        orderId: maDonHang,
        customerId: customerCode.toString(),
        total: total
      });
    } catch (error) {
      console.error('Lỗi trong transaction:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error.message.includes('ORA-')) {
        console.error('Lỗi Oracle:', error.message);
      }

      if (conn) {
        try {
          await conn.execute('ROLLBACK TO SAVEPOINT start_transaction', [], { autoCommit: false });
        } catch (e) {
          console.error('Lỗi khi rollback:', e);
        }
      }

      res.status(500).json({ 
        error: 'Lỗi khi xử lý đơn hàng', 
        details: error.message 
      });
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (error) {
          console.error('Lỗi khi đóng kết nối:', error);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi xử lý đơn hàng:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    res.status(500).json({ 
      error: 'Lỗi khi xử lý đơn hàng', 
      details: error.message 
    });
  }
}); 

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});