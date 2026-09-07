import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Credentials({
      id: "credentials", // Optional: Defaults to "credentials"
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // REQUIRED: authorize function MUST be present
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.API_BASE_URL}/auth/login`,
          {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          },
        );

        const data = await res.json();

        if (res.ok && data.token) {
          return {
            id: data.user?.id || data.id,
            email: credentials?.email,
            token: data.token,
          };
        } else {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken as string,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
