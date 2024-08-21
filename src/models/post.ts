import mongoose, { ObjectId, Schema } from "mongoose";
import { commentSchema } from "./comment.js";

const postSchema = new mongoose.Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Referencing the same schema
        required: true
    },
    body: {
        type: String,
        required: true,
        maxlength: 500,
    },
    image: {
        type: String,
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],

    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'  
        }
    ],

    dislikes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    private: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });


// Model name is 'Post', and explicitly defining the collection name 'posts'
const Post = mongoose.model("Post", postSchema, "posts");


export { postSchema, Post };

// --- Post DB functions ---

// get
export const getAllPosts = () => Post.find({private: false}).sort({ createdAt: -1}).limit(50);
export const getPostById = (id: string) => Post.findById(id);
export const getPostsByUserId = (uid: string) => Post.find( {"author": uid});
export const getPostsByUserIds = (userIds) => Post.find({ author: { $in: userIds } }).sort({ createdAt: -1}).limit(50);
export const getExtraPosts = (userIds, amount: number) => Post.find({
    author: { $nin: userIds },
    private: false})
    .sort({ createdAt: -1}).limit(amount);


// post 
export const addPost = (values) => Post.create(values);

// update
export const updatePost = (id, values: Record<string, any>) => Post.findByIdAndUpdate(id, values, {new: true});

// del
export const deletePost = (user, id) => Post.findOneAndDelete( {author: user, _id: id} );

export const deletePostAdmin = (_id) => {
    return Post.findOneAndDelete({ _id });
};