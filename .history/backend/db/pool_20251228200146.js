import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

console.log("PG_URL at pool init:", process.env.PG_URL);

const pool = new Pool({
  connectionString: process.env.PG_URL,
});

export default pool;
