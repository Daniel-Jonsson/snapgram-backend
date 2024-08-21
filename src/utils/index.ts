import cron from "node-cron"
import { FriendRequest } from "../models/friendRequest.js";

export const customKeyGenerator = (req, res) => {
	const ip = req.ip || req.connection.remoteAddress;
	return ip.replace(/:\d+[^:]*$/, ""); // Remove port number if present
};

cron.schedule("0 0 * * *", async () => {
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - 30);

        const deletedRequests = await FriendRequest.deleteMany({
            createdAt: { $lt: expiryDate },
        });
        
        console.log(`Deleted ${deletedRequests.deletedCount} old friend requests`);
    } catch (error) {
        
    }
})
