import express from 'express';
import 'dotenv/config';
const app = express();
import Router from './routes/routes.js';
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*"
}));

app.use(cors(corsOptions));

app.use(express.json())

app.use('/', Router)

app.listen(3000, () => {
    console.log('Aplicativo Online!')
})