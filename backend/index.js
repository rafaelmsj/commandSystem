import express from 'express';
import 'dotenv/config';
import Router from './routes/routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cookieParser()); 

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(","),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
}));

app.use('/', Router)

app.listen(process.env.PORT, () => {
    console.log('Aplicativo Online!')
})