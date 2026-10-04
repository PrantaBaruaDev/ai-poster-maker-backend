import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	app_url: process.env.APP_URL,
	frontend_url: process.env.FRONTEND_URL,
	bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
	jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN as string,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,

	redis_user: process.env.REDIS_USER!,
	redis_password: process.env.REDIS_PASSWORD!,
	redis_host: process.env.REDIS_HOST!,
	redis_port: process.env.REDIS_PORT!,

	cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
	cloudinary_api_secrect: process.env.CLOUDINARY_API_SECRECT!,
	cloudinary_folder: process.env.CLOUDINARY_FOLDER ?? "poster-maker",

	gemini_api_key: process.env.GEMINI_API_KEY!,
	gemini_model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",

	bkash_base_url: process.env.BKASH_BASE_URL!,
	bkash_username: process.env.BKASH_USERNAME!,
	bkash_password: process.env.BKASH_PASSWORD!,
	bkash_app_key: process.env.BKASH_APP_KEY!,
	bkash_app_secret: process.env.BKASH_APP_SECRET!,
	bkash_callback_url: process.env.BKASH_CALLBACK_URL!,

	max_retries: Number(process.env.MAX_RETRIES ?? 3),
	rate_limit_window_ms: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 3600000),
	rate_limit_poster_max: Number(process.env.RATE_LIMIT_POSTER_MAX ?? 10),
	rate_limit_upload_max: Number(process.env.RATE_LIMIT_UPLOAD_MAX ?? 30),

	global_rate_limit_window_ms: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
	global_rate_limit_max: Number(process.env.GLOBAL_RATE_LIMIT_MAX ?? 100),

	auth_rate_limit_window_ms: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60_000),
	auth_rate_limit_max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),

	max_upload_bytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
	max_photos_per_poster: Number(process.env.MAX_PHOTOS_PER_POSTER ?? 3),
};
