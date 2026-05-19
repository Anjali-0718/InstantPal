// index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';

import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';

import Order from './models/Order.js';
import User from './models/User.js';

dotenv.config();
const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

//   CLIENT_URL=https://instantpal-client.onrender.com
//   CLIENT_URL_2=http://localhost:5173
const normalizeOrigin = (o) => {
  try { return new URL(o).origin; } catch { return o; }
};

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',   // Vite dev // CRA/dev alternative
].filter(Boolean).map(normalizeOrigin);


const corsOptions = {
  origin: (origin, callback) => {
  
    if (!origin) return callback(null, true);

    const ori = normalizeOrigin(origin);
    if (allowedOrigins.includes(ori)) return callback(null, true);

    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, 
};


app.use(cors(corsOptions));

app.options('*', cors(corsOptions));


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (_req, res) => res.send('Instapal backend is running 🚀'));


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));


const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    credentials: true,
  },
});
app.set('io', io);
io.on('connection', (socket) => {
  console.log(`📡 User connected: ${socket.id}`);

  socket.on('join_order_room', (orderId) => {
    if (!orderId) return;
    socket.join(orderId);
    console.log(`User ${socket.id} joined room ${orderId}`);
  });

  socket.on('leave_order_room', (orderId) => {
    if (!orderId) return;
    socket.leave(orderId);
    console.log(`User ${socket.id} left room ${orderId}`);
  });

  socket.on('send_message', async ({ orderId, userId, text }) => {
    try {
      const trimmed = (text || '').trim();
      if (!orderId || !userId || !trimmed) return;

      const user = await User.findById(userId);
      if (!user) return;

      const message = {
        user: userId,
        name: user.name,
        text: trimmed,
        createdAt: new Date(),
      };

      await Order.findByIdAndUpdate(
        orderId,
        { $push: { chat: message } },
        { new: true }
      );

      const updated = await Order.findById(orderId).populate('chat.user', 'name');
      if (!updated || !updated.chat?.length) return;

      const lastMessage = updated.chat[updated.chat.length - 1];
      io.to(orderId).emit('receive_message', lastMessage);
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));