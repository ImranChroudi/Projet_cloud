const express = require("express")
const router = express.Router()

const {
 addComment,
 getComments
} = require("../controllers/commentController")

router.post("/", addComment)

router.get("/:taskId", getComments)

module.exports = router
