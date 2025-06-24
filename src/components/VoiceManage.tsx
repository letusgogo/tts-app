import React from "react";
import VoiceBlock from "@/components/VoiceBlock";
import { Button } from "@/components/ui/button";
import { PlusCircle, PlayCircle } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useImmer } from "use-immer";
import { signIn } from "next-auth/react";

export type Sentence = {
    id: string
    text: string
    pitch: string
    speed: string
    audioUrl?: string
    loading?: boolean
    error?: string
}

export type VoiceBlockData = {
    id: string
    voice: string
    sentences: Sentence[]
    synthesisUrl?: string
}

export default function VoiceManage() {
    const [blocks, updateBlocks] = useImmer<VoiceBlockData[]>([
        {
            id: crypto.randomUUID(),
            voice: "BV138_streaming",
            sentences: [
                { id: crypto.randomUUID(), text: "What's the purpose of this project? What does it do?", pitch: "1.0", speed: "1.0" },
            ]
        },
        {
            id: crypto.randomUUID(),
            voice: "BV027_streaming",
            sentences: [
                { id: crypto.randomUUID(), text: "EchoLearner is built for language learners like you. You can pick a voice, type in any text, and instantly turn it into speech. ", pitch: "normal", speed: "normal" },
                { id: crypto.randomUUID(), text: "It's a great way to create your own listening materials.", pitch: "1.0", speed: "1.0" }
            ],
        },
        {
            id: crypto.randomUUID(),
            voice: "BV138_streaming",
            sentences: [
                { id: crypto.randomUUID(), text: "uh...  So, you mean, I can use it to practice English listening? ", pitch: "1.0", speed: "1.0" },
            ]
        },
        {
            id: crypto.randomUUID(),
            voice: "BV027_streaming",
            sentences: [
                { id: crypto.randomUUID(), text: "Absolutely. You can adjust the speed, pitch, and voice style — perfect for training your ears, preparing dialogues, or even building your own study content.", pitch: "1.0", speed: "1.0" },
            ],
        },
    ]);
    const [synthesisUrl, setSynthesisUrl] = React.useState<string | null>(null);
    const [merging, setMerging] = React.useState(false);
    const [mergeError, setMergeError] = React.useState<string | null>(null);
    const [mergeSuccess, setMergeSuccess] = React.useState(false);
    const translation = useTranslations();

    // 生成语音
    async function handleGenerate(blockId: string, sentenceId: string, text: string, voice: string) {
        updateBlocks(draft => {
            const block = draft.find(b => b.id === blockId);
            if (block) {
                const sentence = block.sentences.find(s => s.id === sentenceId);
                if (sentence) {
                    sentence.loading = true;
                    sentence.error = undefined;
                }
            }
        });
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    signIn("casdoor");
                    return;
                }
                throw new Error(errorData.error || `生成失败 (${res.status})`);
            }
            const data = await res.json();
            updateBlocks(draft => {
                const block = draft.find(b => b.id === blockId);
                if (block) {
                    const sentence = block.sentences.find(s => s.id === sentenceId);
                    if (sentence) {
                        sentence.audioUrl = data.audioUrl;
                        sentence.loading = false;
                        sentence.error = undefined;
                    }
                }
            });
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : "生成失败";
            updateBlocks(draft => {
                const block = draft.find(b => b.id === blockId);
                if (block) {
                    const sentence = block.sentences.find(s => s.id === sentenceId);
                    if (sentence) {
                        sentence.loading = false;
                        sentence.error = errMsg;
                    }
                }
            });
        }
    }

    // 批量生成某个 Block 下所有句子的语音
    async function handleBlockGenerate(blockId: string) {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;
        for (const s of block.sentences) {
            if (!s.audioUrl && s.text.trim()) {
                await handleGenerate(block.id, s.id, s.text, block.voice);
            }
        }
    }

    // 增加 Block
    const addBlock = () => {
        updateBlocks(draft => {
            draft.push({
                id: crypto.randomUUID(),
                voice: "BV511_streaming",
                sentences: [
                    { id: crypto.randomUUID(), text: "", pitch: "1.0", speed: "1.0" }
                ]
            });
        });
    }
    // 删除 Block
    const removeBlock = (id: string) => {
        updateBlocks(draft => {
            const index = draft.findIndex(b => b.id === id);
            if (index !== -1) {
                draft.splice(index, 1);
            }
        });
    }
    // 更新 Block
    const updateBlock = (id: string, data: Partial<VoiceBlockData>) => {
        updateBlocks(draft => {
            const block = draft.find(b => b.id === id);
            if (block) {
                Object.assign(block, data);
            }
        });
    }

    // 合并音频
    async function handleMergeAudio() {
        setMerging(true);
        setMergeError(null);
        setMergeSuccess(false);

        try {
            // 收集所有音频数据
            const audioDatas: { base64: string }[] = [];

            // 处理每个block的每个sentence
            for (const block of blocks) {
                for (const sentence of block.sentences) {
                    if (sentence.text.trim()) {
                        let audioUrl = sentence.audioUrl;

                        // 如果没有音频，先生成
                        if (!audioUrl) {
                            try {
                                const res = await fetch("/api/tts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        text: sentence.text,
                                        voice: block.voice,
                                        pitch: sentence.pitch,
                                        speed: sentence.speed
                                    }),
                                });

                                if (!res.ok) {
                                    const errorData = await res.json().catch(() => ({}));
                                    if (res.status === 401) {
                                        signIn("casdoor");
                                        return;
                                    }
                                    throw new Error(errorData.error || `生成失败 (${res.status})`);
                                }

                                const data = await res.json();
                                audioUrl = data.audioUrl;

                                // 更新状态
                                updateBlocks(draft => {
                                    const s = draft.find(b => b.id === block.id)?.sentences.find(s => s.id === sentence.id)
                                    if (s) {
                                        Object.assign(s, { audioUrl, loading: false, error: undefined })
                                    }
                                });
                            } catch (e) {
                                const errMsg = e instanceof Error ? e.message : "生成失败";
                                updateBlocks(draft => {
                                    const s = draft.find(b => b.id === block.id)?.sentences.find(s => s.id === sentence.id)
                                    if (s) {
                                        Object.assign(s, { loading: false, error: errMsg })
                                    }
                                });
                                throw e;
                            }
                        }

                        // 提取base64数据
                        if (audioUrl && audioUrl.startsWith('data:audio/mp3;base64,')) {
                            const base64 = audioUrl.split(',')[1];
                            audioDatas.push({ base64 });
                        }
                    }
                }
            }

            if (audioDatas.length === 0) {
                throw new Error("没有可合并的音频");
            }

            const res = await fetch("/api/synthesize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioDatas }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    signIn("casdoor");
                    return;
                }
                throw new Error(errorData.error || `合并失败 (${res.status})`);
            }

            const data = await res.json();
            setMergeSuccess(true);
            setSynthesisUrl(data.synthesisUrl);
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : "合并失败";
            setMergeError(errMsg);
        } finally {
            setMerging(false);
        }
    }

    return (
        <div className="space-y-6 w-full max-w-6xl bg-white p-6 rounded shadow">
            {blocks.map((block) => (
                <div className="relative" key={block.id}>
                    <VoiceBlock
                        key={block.id}
                        voice={block.voice}
                        sentences={block.sentences}
                        onChange={(data) => updateBlock(block.id, data)}
                        onGenerate={(sentenceId: string, text: string) => handleGenerate(block.id, sentenceId, text, block.voice)}
                        onBlockGenerate={() => handleBlockGenerate(block.id)}
                        onDeleteBlock={() => removeBlock(block.id)}
                    />
                </div>
            ))}

            {/* 添加 Block 按钮 */}
            <div className="flex justify-center">
                <Button
                    onClick={addBlock}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 bg-transparent text-gray-500 font-bold uppercase text-lg shadow-none hover:bg-gray-100 min-w-[220px]"
                    variant="ghost"
                >
                    <PlusCircle className="w-6 h-6" />
                    {translation('add_voice_block')}
                </Button>
            </div>
            {/* 合并音频按钮 */}
            <div className="flex justify-center">
                <Button
                    onClick={handleMergeAudio}
                    disabled={merging}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 bg-transparent text-gray-500 font-bold uppercase text-lg shadow-none hover:bg-gray-100 min-w-[220px]"
                    variant="ghost"
                >
                    <PlayCircle className="w-6 h-6" />
                    {merging ? translation('merging_audio') : translation('merge_audio')}
                </Button>
            </div>

            {/* 合并状态提示 */}
            {mergeError && (
                <div className="text-center text-red-500 text-sm">
                    {translation('merge_error')}: {mergeError}
                </div>
            )}
            {mergeSuccess && synthesisUrl && (
                <div className="flex justify-center">
                    <audio src={synthesisUrl} controls className="w-full" />
                </div>
            )}
        </div>
    )
} 