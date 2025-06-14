import NextAuth, { NextAuthOptions } from "next-auth";
import OktaProvider from "next-auth/providers/okta"

declare module "next-auth" {
    interface Session {
        user?: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            leftTime?: number;
        };
    }
    interface Profile {
        score?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        leftTime?: number;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        OktaProvider({
            id: "casdoor",
            name: "Casdoor",
            clientId: process.env.CASDOOR_CLIENT_ID!,
            clientSecret: process.env.CASDOOR_CLIENT_SECRET!,
            issuer: process.env.CASDOOR_ISSUER!,
            wellKnown: process.env.CASDOOR_WELL_KNOWN, // 推荐直接用 well-known 地址
            authorization: { params: { scope: "openid profile email" } },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.leftTime = token.leftTime;
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.id = profile.sub   // 用户唯一标识
                token.leftTime = profile.score;
            }
            console.debug('token:', token)
            return token;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 