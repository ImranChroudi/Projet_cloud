const mongoose = require("mongoose")

const CommentSchema = new mongoose.Schema({

 taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
 },

 text: String,

 userId: String

},{timestamps:true})

module.exports = mongoose.model("Comment", CommentSchema)
