import mongoose, { ObjectId, Schema } from "mongoose";

const notificationSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			enum: [
				"like",
				"dislike",
				"follow",
				"comment",
				"like_comment",
				"dislike_comment",
				"reply_comment",
				"friend_request",
			],
			required: true,
		},
		initiator: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		post: {
			type: Schema.Types.ObjectId,
			ref: "Post",
		},
		comment: {
			type: Schema.Types.ObjectId,
			ref: "Comment",
		},
		read: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

notificationSchema.index(
	{ createdAt: 1 },
	{ expireAfterSeconds: 24 * 60 * 60 }
);

const Notification = mongoose.model(
	"Notification",
	notificationSchema,
	"notifications"
);

export { Notification };
