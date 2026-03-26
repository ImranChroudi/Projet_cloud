const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const authentificationToken= require("../authMiddleware/middlewere");


// GET ALL USERS

router.get("/", authentificationToken, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, is_blocked, created_at FROM users"
    );

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// GET USER BY ID

router.get("/:id", authentificationToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await db.query(
      "SELECT id, name, email, role, is_blocked FROM users WHERE id=?",
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// ADD USER

router.post("/", authentificationToken, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check email exist
    const [exist] = await db.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.json({ message: "Utilisateur ajouté avec succès" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// UPDATE USER

router.put("/:id", authentificationToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(
        "UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?",
        [name, email, role, hashedPassword, id]
      );
    } else {
      await db.query(
        "UPDATE users SET name=?, email=?, role=? WHERE id=?",
        [name, email, role, id]
      );
    }

    res.json({ message: "Utilisateur mis à jour" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// DELETE USER

router.delete("/:id", authentificationToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM users WHERE id=?", [id]);

    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


//  BLOCK USER

router.put("/block/:id", authentificationToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE users SET is_blocked = true WHERE id=?",
      [id]
    );

    res.json({ message: "Utilisateur bloqué" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


//  UNBLOCK USER

router.put("/unblock/:id", authentificationToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE users SET is_blocked = false WHERE id=?",
      [id]
    );

    res.json({ message: "Utilisateur débloqué" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


//  SEARCH USERS
router.get("/search/:keyword", authentificationToken, async (req, res) => {
  try {
    const { keyword } = req.params;

    const [users] = await db.query(
      `SELECT id, name, email, role, is_blocked
       FROM users
       WHERE name LIKE ? OR email LIKE ? OR role LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;