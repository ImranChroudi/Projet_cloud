const Comment = require("../models/Comment")

exports.addComment = async (req,res)=>{
 try{
  const comment = new Comment({
   taskId: req.params.taskId,
   text: req.body.text,
   userId: req.body.userId
  })
  await comment.save()
  res.json(comment)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.getComments = async (req,res)=>{
 try{
  const comments = await Comment.find({
   taskId: req.params.taskId
  })
  res.json(comments)
 }catch(err){
  res.status(500).json(err)
 }
}
