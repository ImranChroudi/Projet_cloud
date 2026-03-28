
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


exports.authMidlleware = (req, res, next) => {

  console.log("Authenticating request...");
  const token = req.headers['authorization'];
  console.log("Received token:", token);


  if (!token) {
    return res.status(401).json({ message: 'khsek tsard token m3a request' })};
  
  const decoded =  jwt.verify(token, process.env.SECRET_TOKEN);

  if(!decoded) {
    return res.status(403).json({ message: 'token maxi f7al li 3andna' })
  };

  console.log("Decoded token:", decoded);
  req.user = {
    userId: decoded.id,
    role: decoded.role,
    email : decoded.email,
    username : decoded.username
  }

  next();

}

