const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD || "", // set via env
  database: "bus_tracking",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
