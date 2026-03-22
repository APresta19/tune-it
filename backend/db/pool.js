import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
            host: process.env.PG_HOST,
            port: Number(process.env.PG_PORT),
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER,
            password: String(process.env.PG_PASSWORD),
          }
);

export default pool;
