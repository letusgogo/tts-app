import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface AudioData {
    base64: string;
}

interface SynthesisRequest {
    audioDatas: AudioData[];
    voice: string;
}

export async function POST(request: Request) {
    try {
        // 直接检查认证
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { audioDatas }: SynthesisRequest = await request.json();

        if (!audioDatas || audioDatas.length === 0) {
            return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
        }

        const buffers = audioDatas.map(audioData => Buffer.from(audioData.base64, 'base64'));
        const combinedBuffer = Buffer.concat(buffers);
        const combinedBase64 = combinedBuffer.toString('base64');
        const synthesisUrl = `data:audio/mp3;base64,${combinedBase64}`;

        return NextResponse.json({ synthesisUrl });
    } catch (error) {
        console.error('合成接口错误:', error);
        return NextResponse.json({
            error: '合成失败',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 