import express from "express";
import { User, getUserById, getUserByEmail, addUser, updateUser, deleteUser, getUsers, getUsersNotFollowedBy } from "../models/user.js";
import { rand, auth, login, logout, verify } from "../auth/auth.js";
import rateLimit from "express-rate-limit";
import { Notification } from "../models/notifications.js";
import { customKeyGenerator } from "../utils/index.js";

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 min
    max: 10,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, 
	keyGenerator: customKeyGenerator,
  });

  router.get("/all/", verify, (req, res) => {
		getUsers()
		.then((users) => res.status(200).send(users))
		.catch((error) => {
			console.log(error)
			res.status(500).send("Internal Server Error.");
		})
  });

  router.post("/not-followed/", verify, (req, res) => {
	const currentUser = req.body.user;

	getUsersNotFollowedBy(currentUser)
	.then((users) => res.status(200).send(users))
	.catch(() => res.status(500).send("Internal Server Error."))
  })
/** GET specific user by ID
 *  Tested to work with wrongly formatted input
 */
router.get("/:id?", verify, (req, res) => {
	const userId = req.session["user"]._id;
	User.findById(req.params.id ?? userId).populate('follows')
		.then((db_answer) => {
			if (db_answer) {
				res.status(200).send(db_answer);
			} else {
				res.status(404).send({ error: "User not found" });
			}
		})
		.catch((err) => res.status(500).send({ error: err.name }));
}); 

/** GET specific user by email
 */
router.get("/email/:email", verify, (req, res) => {
	getUserByEmail(req.params.email)
		.then((db_answer) => {
			if (db_answer) {
				res.status(200).send(db_answer);
			} else {
				res.status(404).send({ error: "User not found" });
			}
		})
		.catch((err) => res.status(500).send({ error: err.name }));
});

/** POST Login a user
 * Accepts username or email.
 */
router.post("/login/", loginLimiter, login);

/** POST Logout a user
 * Accepts username or email.
 */
router.post("/logout/", logout);


/** 
 * POST a user
 */
router.post("/register", loginLimiter, async (req, res) => {
	try {
		const { firstname, lastname, email, password, username, admin } = req.body;

		if (!email || !password || !firstname || !lastname || !username) {
			return res.status(400).send("Missing needed information");
		}

		const salt = rand();
		const user = await addUser({
			email,
			firstname,
			lastname,
			username,
			admin,
			salt,
			password: auth(salt, password),
		});

		return res.status(200).send(user);
	} catch (err) {
		console.log(err);
		return res.status(400).send(err);
	}
});


/** 
 * GET follow user by ID
 */
router.get("/follow/:followId", verify, async (req, res) => {

	const followUserPromise = getUserById(req.params.followId).exec();
	const currentUserPromise = getUserById(req.body.identity._id).exec();
	const [followUser, currentUser] = await Promise.all([
		followUserPromise,
		currentUserPromise,
	]);

	if (!followUser || !currentUser) {
		return res.sendStatus(400);
	}

	// Cannot follow yourself
	if (currentUser._id.toString() == followUser._id.toString()) {
		return res.status(400).send("Cannot follow yourself.");
	}


	// If already followed, return 400
	if (currentUser.follows.includes(followUser._id)) {
		return res.status(400).send("Already followed.");
	}

	// Otherwise, add new follow!
	currentUser.follows.push(followUser._id)
	await currentUser.populate("follows");
	await currentUser.save();

	await Notification.create({
		user: followUser._id,
		type: 'follow',
		initiator: currentUser._id,
	});

	res.status(200).send(currentUser);
});

/** GET unfollow user by ID
 */
router.get("/unfollow/:followId", verify, async (req, res) => {
    console.log("unfollow endpoint entered");
    const followUserPromise = getUserById(req.params.followId).exec();
    const currentUserPromise = getUserById(req.body.identity._id).exec();
    const [followUser, currentUser] = await Promise.all([
        followUserPromise,
        currentUserPromise,
    ]);

    if (!followUser || !currentUser) {
        return res.sendStatus(400);
    }

    const currentUserFollowArr = currentUser.follows;
	const followUserFollowArr = followUser.follows;
    const currentUserIdx = currentUserFollowArr.indexOf(followUser._id);
	const followUserIdx = followUserFollowArr.indexOf(currentUser._id);
    if (currentUserIdx === -1 || followUserIdx === -1) {
		return res.sendStatus(400);
	}
    await currentUser.populate("follows");
    currentUserFollowArr.splice(currentUserIdx, 1);
	followUserFollowArr.splice(followUserIdx, 1);
	await followUser.save();

    currentUser
        .save()
        .then((user) => res.status(200).send(user))
        .catch((err) => res.status(400).send("Internal Server Error."));
});

/**
 *  Edit user
 */
router.put("/edit/:id", verify, async (req, res) => {
	try {
		const currentUserId = req.body.identity._id;
		const isAdmin = req.body.identity.admin;
		const data = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			description: req.body.description,
			profilePicture: req.body.profilePicture,
			admin: req.body.admin ?? false,
		}

		if (currentUserId !== req.params.id && !isAdmin) {
			res.status(403).send("Cannot edit this user!");
		}
		const updatedUser = await updateUser(req.params.id, data).populate("follows");

		res.status(200).send(updatedUser);

	} catch (err) {
		res.status(500).send("Internal Server Error.");
	}
})

router.delete("/:id", verify, async (req, res) => {
	try {
		const currentUserId = req.body.identity._id;
		const isAdmin = req.body.identity.admin;

		if (currentUserId !== req.params.id && !isAdmin) {
			res.status(403).send("Cannot delete this user!");
		}

		await deleteUser(req.params.id);
		res.sendStatus(200);
	} catch (err) {
		res.status(500).send("Internal Server Error.")
	}
})
export const usersRouter = router;
