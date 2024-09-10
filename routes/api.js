'use strict';
const { Thread, Reply } = require('../database/models.js');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      try {

        const newThread = new Thread({
          board,
          text,
          delete_password,
          bumped_on: Date.now(),
          created_on: Date.now()
        });
        await newThread.save();
        
        return res.status(200).redirect('/b/' + newThread.board);

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error posting thread" });
      }

    })
    .get(async (req, res) => {
      const board = req.params.board;

      try {

        const threadArray = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select('-delete_password -reported')
          .lean();

        const updatedThreadArray = threadArray.map(thread => ({
          ...thread, 
          replycount: thread.replies.length,
          replies: thread.replies
            .slice(-3)
            .map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            }))
        }));

        return res.status(200).json(updatedThreadArray);

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching threads" });
      }

    })
    .delete(async (req, res) => {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;      

      try {

        const thread = await Thread.findById(thread_id);

        if (thread.delete_password !== delete_password) {
          return res.status(401).send("incorrect password");
        }

        await Thread.findByIdAndDelete(thread_id);

        return res.status(200).send("success");

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error deleting thread" });
      }

    })
    .put(async (req, res) => {
      const board = req.params.board;
      const { thread_id } = req.body;

      try {

        const thread = await Thread.findByIdAndUpdate(thread_id, { reported: true }, { new: true });
        
        return res.status(200).send("reported");

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error updating thread" });
      }

    })




  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password, thread_id } = req.body;

      try {

        const newReply = new Reply({
          text,
          delete_password,
          created_on: Date.now()
        });
        await newReply.save();

        const currThread = await Thread.findByIdAndUpdate(
          thread_id,
          { bumped_on: newReply.created_on, $push: { replies: newReply }  },
          { new: true }
        );        

        return res.status(200).redirect('/b/' + board + '/' + thread_id)

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error posting reply" });
      }

    })
    .get(async (req, res) => {
      const board = req.params.board;
      const thread_id = req.query.thread_id;

      try {

        let entireThread = await Thread.findById(thread_id)
          .select('-delete_password -reported')
          .lean();
        
        entireThread.replies = entireThread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }));
        
        return res.status(200).json(entireThread);

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching replies" });
      }

    })
    .delete(async (req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;

      try {

        const thread = await Thread.findById(thread_id);

        const reply = thread.replies.id(reply_id);

        if (reply.delete_password !== delete_password) {
          return res.status(401).send("incorrect password");
        }

        reply.text = '[deleted]';
        await thread.save();       

        return res.status(200).send("success");

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error deleting reply" });
      }

    })
    .put(async (req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;

      try {

        const thread = await Thread.findById(thread_id);

        const reply = thread.replies.id(reply_id);

        reply.reported = true;

        await thread.save();
              
        return res.status(200).send("reported");

      } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Error updating reply" });
      }

    })




};
