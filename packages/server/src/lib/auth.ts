import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import { NextRequest } from 'next/server';
import { decode } from 'jsonwebtoken';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = decode(token) as { email?: string } | null;
    if (!decoded?.email) return null;

    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    return user;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new Error('Unauthorized');
  }
  return true;
}