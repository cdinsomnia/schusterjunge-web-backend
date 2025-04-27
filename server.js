import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './src/lib/prisma.js';
import authRoutes from './src/routes/authRoutes.js';

import { protect } from './src/middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS config

const corsConfig = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}

// Middleware
app.use(cors);
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
    console.error("Error while getting events:", error);
    res.status(500).json({ error: 'Error while getting events' });
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
     console.error("Error by creating new event:", error);
     res.status(500).json({ error: 'Error by creating event' });
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
                date: new Date(date),
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
        console.error(`Error by updating event with id ${id}:`, error);
        if (error.code === 'P2025') {
             return res.status(404).json({ error: 'Event not found' });
        }
        res.status(500).json({ error: 'Error by updating event' });
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
        console.error(`Error deleting event with id ${id}:`, error);
        if (error.code === 'P2025') {
             return res.status(404).json({ error: 'Event not found' });
        }
        res.status(500).json({ error: 'Error by deleting event' });
    }
});


app.listen(PORT, () => {
  console.log(`Backend Server now running on http://localhost:${PORT}`);
});