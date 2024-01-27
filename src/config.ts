import { DataSource } from "typeorm"
import Tables from "./entities";
import dotenv from "dotenv";
dotenv.config()
const AppDataSource = new DataSource({
    type: "postgres",
    host: "127.0.0.1",
    port: 5432,
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: "udaanapp",
    entities: Tables,
    synchronize: true,
    logging: true
});

export default AppDataSource;
