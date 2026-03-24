import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authMidlleware = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'khsek tsard token m3a request' })};
  
  const decoded =  jwt.verify(token, process.env.SECRET_TOKEN);

  if(!decoded) {
    return res.status(403).json({ message: 'token maxi f7al li 3andna' })
  };

  console.log("Decoded token:", decoded);
  req.user = {
    id: decoded.id,
    role: decoded.role,
    email : decoded.email
  }

  next();

}

export default authMidlleware;