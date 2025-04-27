// server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './src/lib/prisma.js';
import authRoutes from './src/routes/authRoutes.js';
import { protect } from './src/middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS config
let allowedOrigin;

switch (process.env.APP_MODE) {
    case 'vercel':
        allowedOrigin = process.env.ALLOWED_ORIGIN_VERCEL;
        break;
    case 'production':
        allowedOrigin = process.env.ALLOWED_ORIGIN_PROD;
        break;
    case 'dev':
    default:
        allowedOrigin = process.env.ALLOWED_ORIGIN_DEV;
        break;
}

if (!allowedOrigin) {
    console.error(`BACKEND: ALLOWED_ORIGIN not defined for APP_MODE: ${process.env.APP_MODE || 'undefined'}. Check your .env file.`);
}

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());

// --- API ---

app.use('/api/auth', authRoutes);

app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc',
      }
    });
    res.json(events);
  } catch (error) {
    console.error("BACKEND: Error while getting events:", error);
    res.status(500).json({ error: 'Internal server error while getting events' });
  }
});

app.post('/api/events', protect, async (req, res) => {
   const { title, date, description, venue, location, imageUrl, ticketUrl } = req.body;
   try {
     const newEvent = await prisma.event.create({
       data: {
         title,
         date: new Date(date),
         description,
         venue,
         location,
         imageUrl,
         ticketUrl,
       },
     });
     res.status(201).json(newEvent);
   } catch (error) {
     console.error("BACKEND: Error by creating new event:", error);
     res.status(500).json({ error: 'Internal server error by creating event' });
   }
});

app.get('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const event = await prisma.event.findUnique({
            where: { id: parseInt(id) },
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error(`BACKEND: Error getting event with id ${id}:`, error);
        res.status(500).json({ error: 'Internal server error getting event' });
    }
});

app.put('/api/events/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { title, date, description, venue, location, imageUrl, ticketUrl } = req.body;
    try {
        const updatedEvent = await prisma.event.update({
            where: { id: parseInt(id) },
            data: {
                title,
                date: date ? new Date(date) : undefined,
                description,
                venue,
                location,
                imageUrl,
                ticketUrl,
                updatedAt: new Date()
            },
        });
        res.json(updatedEvent);
    } catch (error) {
        console.error(`BACKEND: Error by updating event with id ${id}:`, error);
        if (error.code === 'P2025') {
             return res.status(404).json({ error: 'Event not found' });
        }
        res.status(500).json({ error: 'Internal server error by updating event' });
    }
});

// DELETE
app.delete('/api/events/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.event.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    } catch (error) {
        console.error(`BACKEND: Error deleting event with id ${id}:`, error);
        if (error.code === 'P2025') {
             return res.status(404).json({ error: 'Event not found' });
        }
        res.status(500).json({ error: 'Internal server error by deleting event' });
    }
});


app.listen(PORT, () => {
  console.log(`Backend Server now running on http://localhost:${PORT} in ${process.env.APP_MODE || 'dev'} mode`);
    if (allowedOrigin) {
        console.log(`BACKEND: Allowed frontend origin for CORS: ${allowedOrigin}`);
    } else {
        console.warn('BACKEND: No specific CORS origin configured!');
    }
});