import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import * as bcrypt from 'bcryptjs';
import { prisma } from "@/utils/prisma";
import NodeCache from 'node-cache';

const useCache = new NodeCache();


const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter Your Email",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        let user;
        try {
          user = await prisma.user.findFirst({
            where: { email: credentials.email },
          });
        } catch (error) {
          console.log(error);
        }

        if (!user) {
          return null;
        }

        const isValidPassword = bcrypt.compareSync(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID! as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account!.provider === "google" && profile!.email) {
        const user = await prisma.user.findFirst({
          where: { email: profile!.email },
        });

        if (user) {
          // Update existing user if necessary
          if (!user.OAuth_ID) {
            await prisma.user.update({
              where: { email: profile!.email },
              data: {
                // @ts-ignore
                image: profile.picture || "default-image.png",
                name: profile!.name,
                OAuth_ID: account!.providerAccountId,
                verified: true,
              },
            });
          }
          return true;
        } else {
          // Create new user if doesn't exist
          await prisma.user.create({
            data: {
              // @ts-ignore
              image: profile!.picture || "default-image.png",
              email: profile!.email,
              username: profile!.name || "",
              OAuth_ID: account!.providerAccountId,
              verified: true,
            },
          });
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      } else {
        let dbUser = useCache.get(`${token.email}`);
        if (dbUser) {
          console.log('user cached');
        } else {
          // Fetch user from DB if not in token
          dbUser = await prisma.user.findFirst({
            where: { email: token.email! },
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              OAuth_ID: true,
              image: true,
              rating: true,
            },
          });
          // clear all caches before that save memory
          useCache.flushAll();
          useCache.set(`${token.email}`, dbUser);
        }
        token.user = dbUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }
      return session;
    }
  },
};

export default authConfig;
