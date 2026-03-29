const Comment = require("../models/Comment")
const Task = require("../models/Task")

exports.addComment = async (req,res)=>{


    console.log("Adding comment to task:", req.body);
 

 try{
  const taskId = req.body.taskId || req.params.taskId;
  const comment = new Comment({
   taskId,
   text: req.body.text,
   userId: req.user.userId,
   userName: req.user.username || "Utilisateur"
  })
  await comment.save()

  // Notify task assignees about the new comment
  const sendNotification = req.app.get("sendNotification");
  if (sendNotification) {
    try {
      const task = await Task.findById(taskId);
      if (task) {
        const recipients = [...new Set([...(task.assignedTo || []), ...(task.createdBy ? [task.createdBy] : [])])];
        for (const userId of recipients) {
          if (userId !== String(req.user.userId)) {
            await sendNotification(
              "comment_added",
              "Nouveau commentaire",
              `${req.user.username || "Un utilisateur"} a commenté sur la tâche "${task.title}"`,
              userId,
              task.projectId
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Error sending comment notification:", notifErr.message);
    }
  }

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
