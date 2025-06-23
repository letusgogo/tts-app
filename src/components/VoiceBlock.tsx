"use client"

import { useImperativeHandle, Ref } from "react"
import { useImmerReducer } from "use-immer"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import SentenceBlock from "./SentenceBlock"
import { useTranslations } from 'next-intl'

export type Props = {
    voice: string
    ref?: Ref<VoiceBlockRef>
}

export type VoiceBlockRef = {
    synthesize: () => Promise<string>
}

type Sentence = {
    id: string
    text: string
    audioUrl?: string
    loading?: boolean
    error?: string
    pitch?: string
    speed?: string
}

type State = {
    role: string
    sentences: Sentence[]
    synthesizing?: boolean
    synthesisError?: string
    synthesisUrl?: string
}

type Action =
    | { type: "SET_ROLE"; payload: string }
    | { type: "ADD_SENTENCE" }
    | { type: "REMOVE_SENTENCE"; payload: string }
    | { type: "SET_SENTENCE_LOADING"; id: string; loading: boolean }
    | { type: "SET_SENTENCE_AUDIO"; id: string; audioUrl: string }
    | { type: "SET_SENTENCE_ERROR"; id: string; error: string }
    | { type: "SET_SENTENCE_TEXT"; id: string; text: string }
    | { type: "SET_SENTENCE_PITCH"; id: string; pitch: string }
    | { type: "SET_SENTENCE_SPEED"; id: string; speed: string }
    | { type: "INSERT_SENTENCE_AFTER"; id: string }
    | { type: "SET_SYNTHESIZING"; payload: boolean }
    | { type: "SET_SYNTHESIS_ERROR"; payload: string }
    | { type: "SET_SYNTHESIS_URL"; payload: string }

type VoiceGroup = {
    name: string
    englishName: string
    voices: {
        [key: string]: {
            name: string
            description: string
        }
    }
}

const initialState = (voice: string): State => ({
    role: voice,
    sentences: [
        {
            id: crypto.randomUUID(),
            text: "",
            pitch: "normal",
            speed: "normal"
        }
    ],
})

function reducer(draft: State, action: Action): void {
    switch (action.type) {
        case "SET_ROLE":
            draft.role = action.payload
            break
        case "ADD_SENTENCE":
            draft.sentences.push({ id: crypto.randomUUID(), text: "", pitch: "normal", speed: "normal" })
            break
        case "REMOVE_SENTENCE":
            draft.sentences = draft.sentences.filter(s => s.id !== action.payload)
            break
        case "SET_SENTENCE_LOADING": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) s.loading = action.loading
            break
        }
        case "SET_SENTENCE_AUDIO": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) {
                s.audioUrl = action.audioUrl
                s.loading = false
                s.error = undefined
            }
            break
        }
        case "SET_SENTENCE_ERROR": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) {
                s.error = action.error
                s.loading = false
            }
            break
        }
        case "SET_SENTENCE_TEXT": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) s.text = action.text
            break
        }
        case "SET_SENTENCE_PITCH": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) s.pitch = action.pitch
            break
        }
        case "SET_SENTENCE_SPEED": {
            const s = draft.sentences.find(s => s.id === action.id)
            if (s) s.speed = action.speed
            break
        }
        case "INSERT_SENTENCE_AFTER": {
            const idx = draft.sentences.findIndex(s => s.id === action.id)
            if (idx !== -1) {
                draft.sentences.splice(idx + 1, 0, { id: crypto.randomUUID(), text: "", pitch: "normal", speed: "normal" })
            }
            break
        }
        case "SET_SYNTHESIZING":
            draft.synthesizing = action.payload
            if (action.payload) {
                draft.synthesisError = undefined
                draft.synthesisUrl = undefined
            }
            break
        case "SET_SYNTHESIS_ERROR":
            draft.synthesisError = action.payload
            draft.synthesizing = false
            break
        case "SET_SYNTHESIS_URL":
            draft.synthesisUrl = action.payload
            draft.synthesizing = false
            draft.synthesisError = undefined
            break
    }
}

export default function VoiceBlock({ voice, ref }: Props) {
    const [state, dispatch] = useImmerReducer(reducer, initialState(voice))
    const t = useTranslations('VoiceBlock')

    async function handleGenerate(sid: string, text: string) {
        dispatch({ type: "SET_SENTENCE_LOADING", id: sid, loading: true })
        try {
            if (text.trim() === "") {
                dispatch({ type: "SET_SENTENCE_ERROR", id: sid, error: "text is empty" })
                return
            }

            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice: state.role }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                if (res.status === 401) {
                    throw new Error("请先登录后再使用此功能")
                }
                throw new Error(errorData.error || `生成失败 (${res.status})`)
            }

            const data = await res.json()
            dispatch({ type: "SET_SENTENCE_AUDIO", id: sid, audioUrl: data.audioUrl })
            return data.audioUrl
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "生成失败"
            dispatch({ type: "SET_SENTENCE_ERROR", id: sid, error: errorMessage })
            throw e
        }
    }

    // Expose synthesize method via ref
    useImperativeHandle(ref, () => ({
        synthesize: async (): Promise<string> => {
            // Set synthesizing state
            dispatch({ type: "SET_SYNTHESIZING", payload: true })

            try {
                // Filter out empty sentences
                const validSentences = state.sentences.filter((s: Sentence) => s.text.trim() !== "")

                if (validSentences.length === 0) {
                    throw new Error("No valid sentences to synthesize")
                }

                // Generate audio for all sentences that don't have audio yet
                const audioPromises = validSentences.map(async (sentence: Sentence) => {
                    if (sentence.audioUrl) {
                        // Extract base64 from data URL
                        const base64 = sentence.audioUrl.split(',')[1]
                        return { base64 }
                    } else {
                        // Reuse handleGenerate logic
                        const audioUrl = await handleGenerate(sentence.id, sentence.text)
                        const base64 = audioUrl.split(',')[1]
                        return { base64 }
                    }
                })

                const audioDatas = await Promise.all(audioPromises)

                // Merge all audio files
                const mergeRes = await fetch("/api/synthesize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ audioDatas }),
                })

                if (!mergeRes.ok) {
                    const errorData = await mergeRes.json().catch(() => ({}))
                    if (mergeRes.status === 401) {
                        throw new Error("请先登录后再使用此功能")
                    }
                    throw new Error(errorData.error || `合并音频失败 (${mergeRes.status})`)
                }

                const mergeData = await mergeRes.json()
                const synthesisUrl = mergeData.synthesisUrl

                // Update state with synthesis result
                dispatch({ type: "SET_SYNTHESIS_URL", payload: synthesisUrl })

                return synthesisUrl
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "合成失败"
                dispatch({ type: "SET_SYNTHESIS_ERROR", payload: errorMessage })
                throw error
            }
        }
    }), [state.sentences, state.role])

    return (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
            <div className="flex items-center gap-2">
                <span className="font-semibold">{t('role')}:</span>
                <Select value={state.role} onValueChange={(v) => dispatch({ type: "SET_ROLE", payload: v })}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder={t('selectVoice')} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(t.raw('voiceGroups')).map(([, group]) => (
                            Object.entries((group as VoiceGroup).voices).map(([voiceId, voice]) => (
                                <SelectItem key={voiceId} value={voiceId}>
                                    {voice.name}{voice.description ? ` - ${voice.description}` : ''}
                                </SelectItem>
                            ))
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Show synthesis status */}
            {state.synthesizing && (
                <div className="text-blue-600">正在合成音频...</div>
            )}
            {state.synthesisError && (
                <div className="text-red-600">合成错误: {state.synthesisError}</div>
            )}
            {/* {state.synthesisUrl && (
                <audio controls className="mt-2 w-full">
                    <source src={state.synthesisUrl} type="audio/mp3" />
                </audio>
            )} */}

            {/* 句子列表 */}
            {state.sentences.map((s: Sentence) => (
                <SentenceBlock
                    key={s.id}
                    value={s.text}
                    audioUrl={s.audioUrl}
                    onChange={val => dispatch({ type: "SET_SENTENCE_TEXT", id: s.id, text: val })}
                    onGenerate={() => handleGenerate(s.id, s.text)}
                    onDelete={() => dispatch({ type: "REMOVE_SENTENCE", payload: s.id })}
                    pitch={s.pitch || "normal"}
                    onPitchChange={val => dispatch({ type: "SET_SENTENCE_PITCH", id: s.id, pitch: val })}
                    speed={s.speed || "normal"}
                    onSpeedChange={val => dispatch({ type: "SET_SENTENCE_SPEED", id: s.id, speed: val })}
                    loading={s.loading}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            dispatch({ type: "INSERT_SENTENCE_AFTER", id: s.id });
                        }
                    }}
                />
            ))}
        </div>
    )
}
