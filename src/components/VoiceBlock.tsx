"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import SentenceBlock from "./SentenceBlock"
import { useTranslations } from 'next-intl'
import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "@/components/ui/Play"
import { X } from "lucide-react"

export type Sentence = {
    id: string
    text: string
    pitch: string
    speed: string
    audioUrl?: string
    loading?: boolean
    error?: string
}

export type VoiceBlockProps = {
    voice: string
    sentences: Sentence[]
    synthesisError?: string
    onChange: (data: Partial<{
        voice: string
        sentences: Sentence[]
        synthesisError?: string
    }>) => void
    onGenerate: (sentenceId: string, text: string) => void
    onBlockGenerate: () => void
    onDeleteBlock?: () => void
}

export default function VoiceBlock({ voice, sentences, synthesisError, onChange, onGenerate, onBlockGenerate, onDeleteBlock }: VoiceBlockProps) {
    const translation = useTranslations('VoiceBlock')
    const [isBlockGenerating, setIsBlockGenerating] = useState(false)
    const [isBlockPlaying, setIsBlockPlaying] = useState(false)
    const [currentPlayingSentenceId, setCurrentPlayingSentenceId] = useState<string | null>(null)
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

    // 角色切换
    const handleRoleChange = (v: string) => {
        onChange({
            voice: v,
            sentences: sentences.map(s => ({
                ...s,
                audioUrl: undefined
            }))
        });
    }

    // 句子相关操作
    const handleSentenceChange = (id: string, data: Partial<Sentence>) => {
        onChange({
            sentences: sentences.map(s =>
                s.id === id
                    ? {
                        ...s,
                        ...data,
                        audioUrl: data.text !== undefined && data.text !== s.text ? undefined : s.audioUrl
                    }
                    : s
            )
        });
    }
    const handleAddSentence = () => {
        onChange({ sentences: [...sentences, { id: crypto.randomUUID(), text: "", speed: "1.0", pitch: "1.0" }] })
    }
    const handleRemoveSentence = (id: string) => {
        onChange({ sentences: sentences.filter(s => s.id !== id) })
    }

    // Block 批量生成/播放逻辑
    const handleBlockPlayClick = async () => {
        const allHaveAudio = sentences.every(s => s.audioUrl);
        if (!allHaveAudio) {
            // 没有音频，批量生成
            setIsBlockGenerating(true);
            try {
                await onBlockGenerate();
            } finally {
                setIsBlockGenerating(false);
            }
        } else {
            // 有音频，依次播放
            setIsBlockPlaying(true);
            try {
                for (const sentence of sentences) {
                    if (sentence.audioUrl) {
                        setCurrentPlayingSentenceId(sentence.id);
                        const audio = audioRefs.current[sentence.id];
                        if (audio) {
                            audio.currentTime = 0;
                            await new Promise<void>((resolve, reject) => {
                                audio.onended = () => resolve();
                                audio.onerror = () => reject(new Error('播放失败'));
                                audio.play().catch(reject);
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('播放音频失败:', error);
            } finally {
                setIsBlockPlaying(false);
                setCurrentPlayingSentenceId(null);
            }
        }
    }

    return (
        <div className="border rounded p-4 bg-gray-50 space-y-3 relative">
            <div className="absolute top-2 right-2 flex gap-2">
                <Button size="icon" variant="ghost" onClick={handleBlockPlayClick} disabled={isBlockGenerating || isBlockPlaying}>
                    <Play rotate={isBlockGenerating || isBlockPlaying} className="w-5 h-5" />
                </Button>
                {onDeleteBlock && (
                    <Button
                        size="icon"
                        variant="ghost" onClick={onDeleteBlock}>
                        <X className="w-5 h-5 text-red-500" />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="font-semibold">{translation('role')}:</span>
                <Select value={voice} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder={translation('selectVoice')} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(translation.raw('voiceGroups')).map(([, group]) => (
                            Object.entries((group as { voices: Record<string, { name: string; description?: string }> }).voices)
                                .map(([voiceId, v]: [string, { name: string; description?: string }]) => (
                                    <SelectItem key={voiceId} value={voiceId}>
                                        {v.name}{v.description ? ` - ${v.description}` : ''}
                                    </SelectItem>
                                ))
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {synthesisError && (
                <div className="text-red-600">{translation('synthesis_error')}: {synthesisError}</div>
            )}

            {/* 句子列表 */}
            {sentences.map((s) => (
                <SentenceBlock
                    key={s.id}
                    value={s.text}
                    audioUrl={s.audioUrl}
                    onChange={val => handleSentenceChange(s.id, { text: val })}
                    onGenerate={() => onGenerate(s.id, s.text)}
                    onDelete={() => handleRemoveSentence(s.id)}
                    pitch={s.pitch || "1.0"}
                    onPitchChange={val => handleSentenceChange(s.id, { pitch: val })}
                    speed={s.speed || "1.0"}
                    onSpeedChange={val => handleSentenceChange(s.id, { speed: val })}
                    loading={s.loading}
                    isPlaying={currentPlayingSentenceId === s.id}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddSentence();
                        }
                    }}
                />
            ))}
            {/* 隐藏的音频元素，用于播放 */}
            {sentences.map((s) => (
                s.audioUrl && (
                    <audio
                        key={s.id}
                        ref={(el) => { audioRefs.current[s.id] = el; }}
                        src={s.audioUrl}
                        style={{ display: 'none' }}
                    />
                )
            ))}
        </div>
    )
}
