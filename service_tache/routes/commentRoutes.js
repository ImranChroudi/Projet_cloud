const express = require("express")
const router = express.Router()

const { authMidlleware } = require("../midllewares/auth")


const {
 addComment,
 getComments
} = require("../controllers/commentController")

router.post("/" , authMidlleware, addComment)

router.get("/:taskId",  getComments)

module.exports = router
