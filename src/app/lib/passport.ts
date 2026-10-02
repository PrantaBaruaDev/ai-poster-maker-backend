import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { prisma } from "./prisma";
import bcryptjs from "bcryptjs";
import config from "@/config";
// import { AuthProvider, Role } from "@db/prisma/generated/prisma/enums";
import { redisClient, redisKey } from "./redis";
import crypto from "crypto";

// passport.use(
// 	new LocalStrategy(
// 		{
// 			usernameField: "email",
// 			passwordField: "password",
// 		},
// 		async (email, password, done) => {
// 			try {
// 				const user = await prisma.users.findUnique({
// 					where: { email },
// 				});

// 				if (!user) {
// 					return done(null, false, {
// 						message: "User does not exists!",
// 					});
// 				}

// 				if (!user.password) {
// 					return done(null, false, {
// 						message:
// 							"This account does not have password, Please login with google",
// 					});
// 				}

// 				const isPasswordMatch = await bcryptjs.compare(password, user.password);

// 				if (!isPasswordMatch) {
// 					return done(null, false, {
// 						message: "Password does not matched",
// 					});
// 				}

// 				return done(null, user as any);
// 			} catch (error) {
// 				return done(error);
// 			}
// 		},
// 	),
// );
