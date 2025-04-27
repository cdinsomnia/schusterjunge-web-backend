import jwt from 'jsonwebtoken'; // Importiere jsonwebtoken

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Check your .env file.');
}

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = { userId: decoded.userId }

    next();

  } catch (error) {
    console.error('Token verfication failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export { protect };