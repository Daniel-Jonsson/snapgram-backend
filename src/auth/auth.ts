import express from 'express';
import { getUserByEmail, getUserByUsername, addUser } from '../models/user.js';
import crypto from "crypto";
import { log } from 'console';


export const register = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
    
        if (!email || !password || !firstname || !lastname) {
            return res.sendStatus(400);
        }

        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return res.sendStatus(400);
        }

        const salt = rand();
        const user = await(addUser( {
            email,
            firstname,
            lastname,
            salt,
            password: auth(salt, password),

        }))

        return res.status(200).send(user);

    } catch (err) {
        console.log(err);
        return res.sendStatus(400);
    }
}


// Login function
export const login = async(req, res) => {
        const { email, password } = req.body;

        if (!password || !email) {
            return res.status(400).send("Missing credentials.");
        }

        const user = email.includes("@") ? await getUserByEmail(email).select("+salt +password").populate('follows').lean() 
        : await getUserByUsername(email.split("@").shift()).select("+salt +password").populate('follows').lean();

        // Verify password
        if (!user || user.password != auth(user.salt, password)) {
            return res.status(401).send("Invalid credentials, try again.");
        }

        req.session.user = user;
        const { password: _, salt, ...userWithoutPassword } = user;
        return res.status(200).send(userWithoutPassword);

};

// Session verification middleware
export const verify = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Session is over"); // send 401 (unauthorized)
        }
        req.body.identity = req.session['user'];
        return next();

    } catch (error) {
        console.log(error);
    }
}

// Logout function
export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.clearCookie('connect.sid'); // Name of the session ID cookie
        res.status(200).send('Logged out successfully');
    });
};


export const rand = () => crypto.randomBytes(128).toString('base64');
export const auth = (salt, pw) => {
    return crypto.createHmac('sha256', [salt, pw].join("-")).update(process.env.SECRET).digest('hex');
};
