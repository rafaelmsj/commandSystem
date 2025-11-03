// middlewares/verifyToken.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'Token não informado' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ success: false, message: 'Token inválido' });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ success: false, message: 'Token mal formatado' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  });
}
