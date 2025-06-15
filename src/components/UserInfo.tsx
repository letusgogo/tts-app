"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function UserInfo() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (!session) {
        return (
            <div className="flex items-center gap-2">
                <span>请登录</span>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => signIn("casdoor")}>登录</button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span>Hi, name: {session.user?.name}, email: {session.user?.email}, leftTime: {session.user?.leftTime}</span>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => signOut()}>登出</button>
        </div>
    );
} 