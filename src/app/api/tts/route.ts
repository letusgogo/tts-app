// import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    // 直接检查认证
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }

    // 解析请求体
    const { text, voice } = await request.json();

    // 火山引擎参数
    const APPID = process.env.VOLC_TTS_APPID!;
    const TOKEN = process.env.VOLC_TTS_TOKEN!;
    const CLUSTER = process.env.VOLC_TTS_CLUSTER!;
    const UID = process.env.VOLC_TTS_UID!;
    const MOCK = process.env.VOLC_TTS_MOCK!;

    // 构造请求体
    const volcReqBody = {
        app: {
            appid: APPID,
            token: TOKEN,
            cluster: CLUSTER,
        },
        user: {
            uid: UID,
        },
        audio: {
            voice_type: voice, // 例如 "BV700_streaming"
            encoding: "mp3",
            rate: 24000,
            compression_rate: 1,
            speed_ratio: 1.0,
            volume_ratio: 1.0,
            pitch_ratio: 1.0,
            emotion: "neutral",
        },
        request: {
            reqid: crypto.randomUUID(),
            text,
            text_type: "plain",
            operation: "query",
            silence_duration: "125",
            with_frontend: "1",
            frontend_type: "unitTson",
            pure_english_opt: "1"
        }
    };

    let volcRes: Response;
    let mockResult: string;
    if (MOCK === 'true') {
        await new Promise(resolve => setTimeout(resolve, 3000));
        mockResult = readFileSync('src/app/api/tts/mock/volcData.json', 'utf-8');
        volcRes = new Response(mockResult, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } else {
        // 请求火山引擎 TTS
        volcRes = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer;${TOKEN}`,
            },
            body: JSON.stringify(volcReqBody),
        });
    }


    const volcData = await volcRes.json();

    // 错误处理
    if (volcData.code !== 3000 || !volcData.data) {
        return NextResponse.json({ error: volcData.message || 'TTS 服务调用失败' }, { status: 500 });
    }

    // 写到文件
    // writeFileSync('src/app/api/tts/volcData.json', JSON.stringify(volcData, null, 2));

    // 返回 base64 音频
    const audioUrl = `data:audio/mp3;base64,${volcData.data}`;
    return NextResponse.json({ audioUrl });
}

