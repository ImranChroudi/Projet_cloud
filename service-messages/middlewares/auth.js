import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Token requis" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN);

    if (!decoded) {
      return res.status(403).json({ message: "Token invalide" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

export default authMiddleware;
