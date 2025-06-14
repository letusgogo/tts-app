import NextAuth, { NextAuthOptions } from "next-auth";
import OktaProvider from "next-auth/providers/okta"

declare module "next-auth" {
    interface Session {
        user?: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            score?: number; // 你的自定义字段
        };
    }
    interface Profile {
        score?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        score?: number;
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
                session.user.score = token.score;
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.id = profile.sub   // 用户唯一标识
                token.score = profile.score;
            }
            return token;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 