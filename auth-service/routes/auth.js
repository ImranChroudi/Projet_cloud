const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET = "ton_secret_jwt";

router.post("/register", async (req, res) => {
  try {
    const {name, email, password} = req.body;
    const [exist] = await db.query("SELECT * FROM users WHERE email = ?",[email] );
    if (exist.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",[name, email, hashedPassword]
    );
    res.json({ message: "Inscription réussie" });
  } catch (error) {
    console.log(error);
    res.json({ message: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const user = rows[0];
     const u = rows[0];

  if (u.is_blocked === 1) {
    return res.status(403).json({ message: "Compte bloqué" });
  }


    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id:user.id, email: user.email ,username: user.name,role:user.role},
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




module.exports = router;