import mongoose, { Schema } from "mongoose";

const friendRequestSchema = new Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	receiver: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	status: {
		type: String,
		enum: ["pending", "accepted", "declined"],
		default: "pending",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const FriendRequest = mongoose.model(
	"FriendRequest",
	friendRequestSchema,
	"friendRequests"
);

export { FriendRequest };
