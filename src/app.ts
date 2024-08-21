import express from 'express'; // for creating an Express server
import cors from 'cors'; // for enabling CORS support
import mongoose from 'mongoose';
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { usersRouter } from './routes/users.js';
import { postsRouter } from './routes/posts.js';
import { notificationsRouter } from "./routes/notifications.js";
import {commentsRouter} from "./routes/comments.js";
import { customKeyGenerator } from './utils/index.js';
import { friendsRouter } from './routes/friendRequests.js';

dotenv.config();


// The Express server instance
const app = express();


// Add CORS middleware to server, allowing it to handle cross-origin requests
const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:3000",
	"https://localhost:8005",
	"https://studenter.miun.se",
];

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.set("trust proxy", 1);

const DB = process.env.DB_SERVER;
mongoose.connect(DB);

const store = MongoStore.create({
	mongoUrl: process.env.DB_SERVER,
	collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60, // 14 days
});

// use session middleware
app.use(
	session({
		secret: process.env.SECRET,
		cookie: {
			sameSite: "none", 
			secure: true, // CHANGE ON PRODUCTION
			httpOnly: true,
			maxAge: 1000 * 60 * 30, // 30 min ttl
		},
    rolling: true,
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 min
    max: 300,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, 
	keyGenerator: customKeyGenerator,
  });

app.use(globalLimiter);

app.use(cookieParser());

// Add express.json middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * The port on which the Express server will listen for incoming requests.
 * Uses the environment variable PORT, if it exists, or defaults to 3000.
 */
const port = process.env.PORT || 3000;


/**
 * The api path as defined in .env
 */
const api_path = process.env.API_PATH || "";

app.use(`${api_path}/users`, usersRouter);
app.use(`${api_path}/posts`, postsRouter);
app.use(`${api_path}/notifications`, notificationsRouter);
app.use(`${api_path}/comments`, commentsRouter);
app.use(`${api_path}/friend-request`, friendsRouter)


app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

app.get("/", function (req, res) {
	res.send("Backend is running");
});