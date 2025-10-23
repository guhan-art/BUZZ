const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "MyBuzz88", // change this to your actual MySQL password
  database: "bus_tracking",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;