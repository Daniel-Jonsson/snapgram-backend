import mongoose, { Schema } from "mongoose";


const commentSchema = new Schema(
	{
		message: {
			type: String,
			required: true,
			maxlength: 500,
		},
		author: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		post: {
			type: Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		parentComment: {
			type: Schema.Types.ObjectId,
			ref: "Comment",
		},
        likes: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        dislikes: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
		replies: [
			{
				type: Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
	},
	{ timestamps: true }
);

// Model name is 'Comment', and explicitly defining the collection name 'comments'
const Comment = mongoose.model("Comment", commentSchema, "comments");

export { Comment, commentSchema };