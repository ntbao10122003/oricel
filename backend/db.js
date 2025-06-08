// db.js
const oracledb = require('oracledb');

const dbConfig = {
  user: 'SYSTEM',
  password: 'abc123',
  connectString: 'DESKTOP-CJ9CU8T.lan:1521/orcl.lan',
};

module.exports = {
  getConnection: () => oracledb.getConnection(dbConfig),
};
