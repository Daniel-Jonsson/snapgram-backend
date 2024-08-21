import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        minlength: 4,
        maxlengthlength: 10,
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        minLength: 7,
        maxlength: 40,
        validate: {
            validator: function(input: string) {
              return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(input);
            },
            message: props => `${props.value} is not a valid email address!`
        },
    },
    firstname: {
        type: String,
        required: true,
        minLength: 2,
        maxlength: 20,
    },
    lastname: {
        type: String,
        required: true,
        minLength: 2,
        maxlength: 20,
    },
    admin: Boolean,
    follows: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'  // Referencing the same schema
        }
    ],
    
    description:  {
        type: String,
        trim: true,
        maxlength: 500,
    },
    profilePicture:  {
        type: String,
        trim: true,
        maxlength: 100,
    },
    password: {
        type: String,
        trim: true,
        required: true,
        select: false, // Dont fetch by default!!
        minLength: 8,
        maxlength: 70, // Will evaluate the hash..
    },
    salt: {
        type: String,
        select: false, // Dont fetch by default!!
    },
}, { timestamps: true });


userSchema.index({ username: 1 }, { unique: true });
// Model name is 'User', and explicitly defining the collection name 'users'
const User = mongoose.model("User", userSchema, "users");

export { userSchema, User };


// --- User DB functions ---

// get
export const getUserByEmail = (email) => User.findOne( {"email": email});
export const getUserByUsername = (username) => User.findOne( {"username": username});
export const getUserById = (id) => User.findById(id);
export const getUsers = () => User.find({});
export const getUsersNotFollowedBy = async (user) => {
    try {
        const followedUserIds = user.follows.map((follow) =>
			follow._id.toString()
		);
        return User.find({ _id: { $ne: user._id, $nin: followedUserIds } });
    } catch (error) {
        throw new Error(
			"Error fetching users not followed by the current user."
		);
    }
}

// post
export const addUser = (values: Record<string, any>) => new User(values).save().then( (user => user.toObject()) );

// update
export const updateUser = (id, values: Record<string, any>) => User.findByIdAndUpdate(id, values, {new: true});

// del
export const deleteUser = (id) => User.findByIdAndDelete(id);