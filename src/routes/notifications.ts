import express from "express";
import { Notification } from "../models/notifications.js";
import { verify } from "../auth/auth.js";

const router = express.Router();

// Get notifications for a user
router.get("/", verify, (req, res) => {
	const userId = req.body.identity._id;
	Notification.find({ user: userId })
		.populate("initiator post comment user")
		.sort({ createdAt: -1 }) // Sort by creation date in descending order
		.then((notifications) => res.status(200).send(notifications))
		.catch((err) => res.status(500).send({ error: err.message }));
});

// Mark notification as read
router.put("/:id/read", verify, (req, res) => {
	Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
		.then((notification) => res.status(200).send(notification))
		.catch((err) => res.status(500).send({ error: err.message }));
});

router.put("/read/all", verify, (req, res) => {
	const userId = req.body.identity._id;
	Notification.updateMany({ user: userId }, { read: true })
		.then(() =>
			res
				.status(200)
				.send({ message: "All notifications marked as read." })
		)
		.catch((err) => res.status(500).send({ error: err.message }));
});

router.delete("/", verify, (req, res) => {
	const userId = req.body.identity._id;
	Notification.deleteMany({ user: userId })
		.then(() =>
			res.status(200).send({ message: "All notifications deleted." })
		)
		.catch((err) => res.status(500).send({ error: err.message }));
});

export const notificationsRouter = router;