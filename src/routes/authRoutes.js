import express from 'express';
const router = express.Router();
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Check your .env file.');
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Benutzername und Passwort werden benötigt.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      return res.status(400).json({ message: 'Fehlerhafte Zugangsdaten' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Fehlerhafte Zugangsdaten' });
    }

    const payload = { userId: user.id };

    if (!process.env.JWT_SECRET) {
         console.error('JWT_SECRET not set');
         return res.status(500).json({ message: 'Configuration Error' });
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (error) {
    console.error('Error during log in:', error);
    res.status(500).json({ message: 'Internal Server error (login)' });
  }
});

export default router;