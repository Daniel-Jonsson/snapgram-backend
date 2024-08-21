import express from "express";
import { Comment } from "../models/comment.js";
import { Post } from "../models/post.js";
import { Notification } from "../models/notifications.js";
import {verify} from '../auth/auth.js'
import { update } from "lodash";

const router = express.Router();

// Create a new top-level comment
router.post("/", verify, async (req, res) => {
	const { message, author, post, parentComment } = req.body;
	try {
		const newComment = new Comment({
			message,
			author,
			post,
			parentComment,
		});
		await newComment.save();

        await newComment.populate("author replies likes dislikes");

		// Add the comment to the post's comments array
		await Post.findByIdAndUpdate(post, {
			$push: { comments: newComment._id },
		});

        const postDoc = await Post.findById(post).populate("author");
        if (postDoc.author.toString() !== author) {
			await Notification.create({
				user: postDoc.author._id,
				type: "comment",
				initiator: author,
				post: postDoc._id,
				comment: newComment._id,
			});
		}

		res.status(201).send(newComment);
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.get("/post/:postId", verify, async (req, res) => {
	const { postId } = req.params;

	try {
		const comments = await Comment.find({
			post: postId,
			parentComment: null,
		}).sort({createdAt: -1}).populate("replies author likes dislikes");
		res.status(200).send(comments);
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

router.get("/:commentId", async (req, res) => {
    const {commentId} = req.params;

    try {
        const comment = await Comment.findOne({_id: commentId}).populate("replies author likes dislikes");
        res.status(200).send(comment)
    } catch (error) {
        res.status(500).send("Internal Server Error.")
    }
})

// Reply to an existing comment
router.post("/reply", verify, async (req, res) => {
	const { message, author, post, parentComment } = req.body;
	try {
		const newComment = new Comment({
			message,
			author,
			post,
			parentComment,
		});
		await newComment.save();

		// Add the reply to the parent comment's replies array
		await Comment.findByIdAndUpdate(parentComment, {
			$push: { replies: newComment._id },
		});


        const parentCommentDoc = await Comment.findById(parentComment).populate(
			"author replies likes dislikes"
		);
		if (parentCommentDoc.author.toString() !== author) {
			await Notification.create({
				user: parentCommentDoc.author._id,
				type: "reply_comment",
				initiator: author,
				post: post,
				comment: newComment._id,
			});
		}

		res.status(201).send(parentCommentDoc);
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.post("/like", verify, async (req, res) => {
	try {
		const { commentId, userId } = req.body;

		let comment = await Comment.findById(commentId).populate("author");
		if (!comment) {
			return res.status(404).send("Comment not found");
		}

		let user = userId;

		let existingNotification = await Notification.findOne({
			user: comment.author,
			type: "like_comment",
			initiator: user,
            post: comment.post,
			comment: comment._id,
		});

		// If already liked, unlike, and return updated object
		if (comment.likes.includes(user)) {
			comment.likes.splice(comment.likes.indexOf(user), 1);
			if (existingNotification) {
				await existingNotification.deleteOne({
					_id: existingNotification._id,
				});
			}
		} else {
			// Otherwise, if currently disliked, undislike
			if (comment.dislikes.includes(user)) {
				comment.dislikes.splice(comment.dislikes.indexOf(user), 1);
			}
			comment.likes.push(user);
			if (!existingNotification) {
				await Notification.create({
					user: comment.author,
					type: "like_comment",
					initiator: user,
					post: comment.post,
					comment: comment._id,
				});
			}
		}

		await comment.save();

		comment = await Comment.findById(commentId).populate(
			"author likes dislikes replies"
		);
		res.status(200).send(comment);
	} catch (error) {
		return res.status(500).send(error.message);
	}
});

router.post("/dislike", verify, async (req, res) => {
	try {
		const { commentId, userId } = req.body;

		let comment = await Comment.findById(commentId).populate("author");
		if (!comment) {
			return res.status(404).send("Comment not found");
		}

		let user = userId;

		let existingNotification = await Notification.findOne({
			user: comment.author,
			type: "dislike_comment",
			initiator: user,
			comment: comment._id,
		});

		// If already disliked, remove dislike, and return updated object
		if (comment.dislikes.includes(user)) {
			comment.dislikes.splice(comment.dislikes.indexOf(user), 1);
			if (existingNotification) {
				await existingNotification.deleteOne({
					_id: existingNotification._id,
				});
			}
		} else {
			// Otherwise, if currently liked, unlike
			if (comment.likes.includes(user)) {
				comment.likes.splice(comment.likes.indexOf(user), 1);
			}
			comment.dislikes.push(user);
			if (!existingNotification) {
				await Notification.create({
					user: comment.author,
					type: "dislike_comment",
					initiator: user,
					comment: comment._id,
				});
			}
		}

		await comment.save();

		comment = await Comment.findById(commentId).populate(
			"author likes dislikes replies"
		);
		res.status(200).send(comment);
	} catch (error) {
		return res.status(500).send(error.message);
	}
});

router.put("/:commentId", verify, async (req, res) => {
	const { commentId } = req.params;
	const { message } = req.body;

	try {
		const updatedComment = await Comment.findByIdAndUpdate(
			commentId,
			{ message },
			{new: true}
		).populate("author replies likes dislikes");

		if (!updatedComment) {
			return res.status(404).send("Comment not found");
		}

		res.status(200).send(updatedComment);
	} catch (error) {
		res.status(500).send("Internal Server Error.");
	}
});

router.delete("/:commentId", async (req, res) => {
	const { commentId } = req.params;

	try {
		const deletedComment = await Comment.findByIdAndDelete(commentId);

		if (!deletedComment) {
			return res.status(404).send("Comment not found");
		}

		// Remove the comment from the parent's replies array, if applicable
		if (deletedComment.parentComment) {
			await Comment.findByIdAndUpdate(deletedComment.parentComment, {
				$pull: { replies: commentId },
			});
		}

		res.status(200).send(deletedComment);
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

export const commentsRouter = router;