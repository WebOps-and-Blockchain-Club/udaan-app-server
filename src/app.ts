import "reflect-metadata"
import express from 'express';
// import { User } from "./entities/user";
import AppDataSource from "./config";
import cors from "cors";
import dotenv from "dotenv"
const app = express();
app.use(express.json());
const port = 3000;
app.use(
    cors({
        origin: "*",
    })
);
dotenv.config();
// app.post('/registration', async (req, resp) => {
 
// });
app.get('/', async (req, resp) => {
 
});

AppDataSource.initialize().then(() => {
    app.listen(port, () => {
        console.log(`application is running on port ${port}.`);
    })
}).catch((err: any) => console.log("error", err));
