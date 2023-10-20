const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Test",
  password: "black@2018",
  port: 5432,
});

module.exports= pool;