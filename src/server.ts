import app from "./app";
import config from "@/config";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { recoverStuckPosters } from "./app/jobs/recovery.job";

const PORT = config.port;

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		// await redisClient.connect();
		// console.log("Redis Connected Successfully.");

		app.listen(PORT, async () => {
			console.log(`Server is running on port ${PORT}: \n\n\t APP_URL: ${config.app_url}`);
			
			await recoverStuckPosters();
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
