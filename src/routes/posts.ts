import express from "express";
import mongoose from 'mongoose';
import { getAllPosts, getExtraPosts, getPostById, getPostsByUserId, getPostsByUserIds, addPost, updatePost, deletePost, deletePostAdmin, Post } from "../models/post.js";
import { getUserById } from "../models/user.js";
import { verify } from '../auth/auth.js';
import { Comment } from '../models/comment.js';
import { log } from "console";
import { Notification } from "../models/notifications.js";
const router = express.Router();


/** Get post feed */
router.get("/feed/followers", verify, async (req, res) => {
    const user = await getUserById(req.body.identity._id.toString());
    const follows = user.follows;
    let posts = await getPostsByUserIds(follows).populate('author likes dislikes comments').lean().exec();

    // If there are fewer than 50 posts, fetch additional non-private posts
    if (posts.length < 50) {
        const remainingCount = 50 - posts.length;
        const additionalPosts = await getExtraPosts(follows, remainingCount).populate('author likes dislikes comments').lean().exec();
                                  
        posts = posts.concat(additionalPosts);
    }
    res.status(200).send(posts);
});

/** Get post feed */
router.get("/feed/all", verify, async (req, res) => {
    console.log("allå");
    
    const posts = await getAllPosts().populate("author likes dislikes comments").exec();
    console.log(posts.length);
    
    res.status(200).send(posts);
});


/** GET specific post NOT verified */
router.get("/:id", (req, res) => {
    getPostById(req.params.id)
		.populate("author likes dislikes comments")
		.then((post) => res.status(200).send(post))
		.catch((err) => {
			console.log(err);
			return res.status(404).send();
		});
});

/** GET posts by user NOT verified */
router.get("/user/:id", verify, (req, res) => {
    getPostsByUserId(req.params.id)
		.sort({ createdAt: -1 })
		.populate("author likes dislikes comments") 
		.then((posts) => {
			res.status(200).send(posts);
		})
		.catch((err) => {
			console.error("Error fetching posts:", err); // Improved error logging
			res.status(404).send("Posts not found"); // Sending a meaningful error response
		});
});

/** Add post */
router.post("/add", verify, async (req, res) => {
    // Append author
    try {
        req.body.author = req.body.identity._id;

		const newPost = await (await addPost(req.body)).populate("author");

        res.status(200).send(newPost)

    } catch {
        res.status(500).send("Internal Server Error");
    }

});

/** Edit post */
router.put("/edit", verify, (req, res) => {  

    if (req.body.identity._id != req.body.author._id && !req.body.identity.admin) {
        console.log("Not correct user!");
        return res.status(403).send("Incorrect user");
    }
    
    updatePost(req.body._id, req.body).then(post => {
        if (!post) {
            return res.status(404).send("Post not found!");
        }
        return res.status(200).send(post)
    }).catch(err => {
        console.log(err);
        return res.status(403).send("validation error");
    });
});

/** Delete post */
router.delete("/delete/:_id", verify, (req, res) => {
    const currentUser = req.body.identity; 
    currentUser.admin ? 
    deletePostAdmin(req.params._id).then(post => {
        if (!post) {
            return res.status(404).send("Post not found!");
        }
        return res.status(200).send(post);
    }) :
    deletePost(currentUser._id, req.params._id).then(post => {
        if (!post) {
            return res.status(404).send("Post not found!");
        }
        return res.status(200).send(post)
    }).catch(err => {
        console.log(err);
        return res.status(403).send("validation error");
    });
});

/** Like post */
router.post("/like", verify, async (req, res) => {
    try {
        let post = await getPostById(req.body._id);

        if (!post) {
			return res.status(404).send("Post not found.");
		}

        let user = req.body.identity._id;

        let existingNotification = await Notification.findOne({
			user: post.author,
			type: "like",
			initiator: user,
			post: post._id,
		});
        
        // If already liked, unlike, and return updated object
        if (post.likes.includes(user)) {
            post.likes.splice(post.likes.indexOf(user), 1);
            if (existingNotification) {
				await existingNotification.deleteOne({ _id: existingNotification._id });
			}
        } else {
			// Otherwise, if currently disliked, undislike!
			if (post.dislikes.includes(user)) {
				post.dislikes.splice(post.likes.indexOf(user), 1);
			}
            post.likes.push(user);
            if (!existingNotification) {
                await Notification.create({
					user: post.author,
					type: "like",
					initiator: user,
					post: post._id,
				});
            }
		}

        await post.save();

        post = await getPostById(req.body._id).populate(
			"author likes dislikes comments"
		);
        res.status(200).send(post);
    } catch (error) {
        return res.status(500).send(error);
    }
    
});

/** Dislike post */
router.post("/dislike", verify, async (req, res) => {
    try {
        let post = await getPostById(req.body._id);

        if (!post) {
			return res.status(404).send("Post not found.");
		}

        let user = req.body.identity._id;

        let existingNotification = await Notification.findOne({
			user: post.author,
			type: "dislike",
			initiator: user,
			post: post._id,
		});
        
        // If already disliked, undislike, and return updated object
        if (post.dislikes.includes(user)) {
            post.dislikes.splice(post.dislikes.indexOf(user), 1);
            if (existingNotification) {
				await existingNotification.deleteOne({
					_id: existingNotification._id,
				});
			}
        } else {
			// Otherwise, if currently liked, unlike!
			if (post.likes.includes(user)) {
				post.likes.splice(post.dislikes.indexOf(user), 1);
			}
            post.dislikes.push(user);
            if (!existingNotification) {
				await Notification.create({
					user: post.author,
					type: "dislike",
					initiator: user,
					post: post._id,
				});
			}
		}

        await post.save();

        post = await getPostById(req.body._id).populate("author likes dislikes comments");
        res.status(200).send(post);
    } catch (error) {
        return res.status(500).send(error);
    }
});




export const postsRouter = router;