const express = require("express");
const router = express.Router();
const db = require("../db");
const authentificationToken = require("../authMiddleware/middlewere");

// all users
router.get("/",authentificationToken, async (req, res) => {
  try {

    const [users] = await db.query("SELECT id,name,email,role,is_blocked FROM users");

    res.json(users);

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


// users by id
router.get("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const [user] = await db.query(
      "SELECT id,name,email,role,is_blocked FROM users WHERE id=?",
      [id]
    );

    if (user.length === 0) {
      return res.json({ message: "Utilisateur non trouvé" });
    }

    res.json(user[0]);

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


// update user
router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { name, email, role } = req.body;

    await db.query(
      "UPDATE users SET name=?, email=?, role=? WHERE id=?",
      [name, email, role, id]
    );

    res.json({ message: "Utilisateur mis à jour" });

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


// delete user
router.delete("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await db.query("DELETE FROM users WHERE id=?", [id]);

    res.json({ message: "Utilisateur supprimé" });

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});

// block user
router.put("/block/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await db.query(
      "UPDATE users SET is_blocked = true WHERE id=?",
      [id]
    );

    res.json({ message: "Utilisateur bloqué" });

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


// unblock user
router.put("/unblock/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await db.query(
      "UPDATE users SET is_blocked = false WHERE id=?",
      [id]
    );

    res.json({ message: "Utilisateur débloqué" });

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


// search users
router.get("/search/:keyword", async (req, res) => {

  try {

    const { keyword } = req.params;

    const [users] = await db.query(
      `SELECT id,name,email,role,is_blocked
       FROM users
       WHERE name LIKE ? 
       OR email LIKE ?
       OR role LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    res.json(users);

  } catch (error) {

    console.log(error);
    res.json({ message: "Erreur serveur" });

  }
});


module.exports = router;