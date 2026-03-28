const Comment = require("../models/Comment")

exports.addComment = async (req,res)=>{


    console.log("Adding comment to task:", req.body);
 

 try{
  const comment = new Comment({
   taskId: req.body.taskId,
   text: req.body.text,
   userId: req.user.userId
  })
  await comment.save()
  res.json(comment)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.getComments = async (req,res)=>{
    console.log("Fetching comments for task:", req.params.taskId);
 try{
  const comments = await Comment.find({
   taskId: req.params.taskId
  })

  
  res.json(comments)
 }catch(err){
  res.status(500).json(err)
 }
}
