import express from "express";
import { verify } from "../auth/auth.js";
import { Notification } from "../models/notifications.js";
import { FriendRequest } from "../models/friendRequest.js";
import { User } from "../models/user.js";

const router = express.Router();


// Get friend requests for a specific user
router.get("/:userId", verify, async (req, res) => {
    const userId = req.params.userId;
    try {
        if (!userId) {
            return res.status(404).send("User ID not found.")
        }

        const friendRequests = await FriendRequest.find({
            sender: userId
        });

        res.status(200).send(friendRequests);

    } catch (error) {
        res.status(500).send("Internal Server Error.")
    }
});

router.get("/status/:initiatorId", verify, async (req, res) => {
    const { initiatorId } = req.params;
    try {
        const friendRequest = await FriendRequest.findOne({
			sender: initiatorId,
		});
        if (!friendRequest) {
           return res.status(404).send("Friend request not found.");
        }
        res.status(200).send(friendRequest.status);
    } catch (error) {
        res.status(500).send("Internal Server Error.")
    }
})

// Add new friend request
router.post("/", verify, async (req, res) => {
    const {senderId, receiverId} = req.body;

    try {
        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: "pending",
        });

        if (existingRequest) {
           return res.status(404).send("Friend request already sent.")
        }
        await FriendRequest.findOneAndDelete({
            sender: senderId,
            receiver: receiverId,
            status: "accepted",
        })
        
        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
        });

        await newRequest.save();


        await Notification.create({
            user: receiverId,
            type: "friend_request",
            initiator: senderId,
        });

        res.status(201).send(newRequest);
    } catch (error) {
        res.status(500).send("Internal Server Error.")
    }
});

// Accept a friend request
router.post("/accept", verify, async (req, res) => {
	const initiatorId = req.body.initiatorId;
    const currentUserId = req.body.identity._id;

	try {
		const request = await FriendRequest.findOne({
			sender: initiatorId,
			receiver: currentUserId,
		});

		if (!request) {
			return res.status(404).send("Friend request not found.");
		}

		request.status = "accepted";
        await request.save();

		// Add each other to the followers array
		await User.findByIdAndUpdate(request.sender, {
			$push: { follows: request.receiver },
		});

		await User.findByIdAndUpdate(request.receiver, {
			$push: { follows: request.sender },
		});

        await Notification.findOneAndDelete({
            initiator: initiatorId,
            user: currentUserId,
            type: "friend_request",
        });


		res.status(200).send("Friend request accepted.");
	} catch (error) {
		res.status(500).send("Internal Server Error.");
	}
});

// Decline a friend request
router.post("/decline", verify, async (req, res) => {
	const initiatorId = req.body.initiatorId;
	const currentUserId = req.body.identity._id;
	try {
		const request = await FriendRequest.findOne({
			sender: initiatorId,
			receiver: currentUserId,
		});

		if (!request) {
			return res.status(404).send("Friend request not found.");
		}

		request.status = "declined";
		await request.save();

        await Notification.findOneAndDelete({
            initiator: initiatorId,
            user: currentUserId,
            type: "friend_request",
        });

		res.status(200).send("Friend request declined.");
	} catch (error) {
		res.status(500).send("Internal Server Error.");
	}
});

router.post("/cancel", verify, async (req, res) => {
    const {senderId, receiverId} = req.body;

    try {
        const request = await FriendRequest.findOne({
			sender: senderId,
			receiver: receiverId,
		});

        if (!request) {
			return res.status(404).send("Friend request not found.");
		}

        await request.deleteOne();

        await Notification.findOneAndDelete({
			initiator: senderId,
			user: receiverId,
			type: "friend_request",
		});

        res.status(200).send("Friend request cancelled.");
    } catch (error) {
        res.status(500).send("Internal Server Error.");
    }
})

export const friendsRouter = router;