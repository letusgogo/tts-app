import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        // 直接检查认证
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // 如果认证成功，返回用户信息
        return NextResponse.json({
            message: "认证成功",
            user: session.user
        });
    } catch (error) {
        console.error('认证测试错误:', error);
        return NextResponse.json({
            error: '认证测试失败',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 