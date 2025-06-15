"use client"

import { useImmerReducer } from "use-immer"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import SentenceBlock from "./SentenceBlock"

export type Props = {
    id: string
    voice: string
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




type Voice = {
    id: string
    name: string
    englishName: string
    description: string
}

type VoiceGroup = {
    name: string
    englishName: string
    voices: Voice[]
}

const voiceGroups: VoiceGroup[] = [
    {
        name: "美式英语", englishName: "en-US", voices: [
            { id: "BV511_streaming", name: "慵懒女声-Ava", englishName: "Ava", description: "【7种情感】通用、开心、悲伤、生气、害怕、厌恶、惊讶" },
            { id: "BV505_streaming", name: "议校女声-Alicia", englishName: "Alicia", description: "" },
            { id: "BV138_streaming", name: "情感女声-Lawrence", englishName: "Lawrence", description: "【8种情感】旁白、平和、开心、悲伤、生气、害怕、厌恶、惊讶" },
            { id: "BV027_streaming", name: "美式女声-Amelia", englishName: "Amelia", description: "" },
            { id: "BV502_streaming", name: "讲述女声-Amanda", englishName: "Amanda", description: "" },
            { id: "BV503_streaming", name: "活力女声-Ariana", englishName: "Ariana", description: "" },
            { id: "BV504_streaming", name: "活力男声-Jackson", englishName: "Jackson", description: "" },
            { id: "BV421_streaming", name: "天才少女", englishName: "Candy2.0", description: "【8国】中文、英语、日语、葡语、西语、印尼语、越南语、泰语" },
            { id: "BV702_streaming", name: "Stefan", englishName: "Stefan", description: "【8国】中文、英语、日语、葡语、西语、印尼语、越南语" },
            { id: "BV506_streaming", name: "天真萌娃-Lily", englishName: "Lily", description: "" },
        ]
    },
    {
        name: "英式英语", englishName: "en-GB", voices: [
            { id: "BV040_streaming", name: "亲切女声-Anna", englishName: "Anna", description: "【7种情感】通用、开心、悲伤、生气、害怕、厌恶、惊讶" },
        ]
    },
    {
        name: "澳洲英语", englishName: "en-AU", voices: [
            { id: "BV516_streaming", name: "澳洲男声-Henry", englishName: "Henry", description: "" },
            { id: "BV520_streaming", name: "元气少女", englishName: "元气少女", description: "" },
        ]
    }
]

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
    }
}

export default function VoiceBlock({ id, voice }: Props) {
    const [state, dispatch] = useImmerReducer(reducer, initialState(voice))

    async function handleGenerate(sid: string, text: string) {
        dispatch({ type: "SET_SENTENCE_LOADING", id: sid, loading: true })
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice: state.role }),
            })
            if (!res.ok) throw new Error("生成失败")
            const data = await res.json()
            dispatch({ type: "SET_SENTENCE_AUDIO", id: sid, audioUrl: data.audioUrl })
        } catch (e: unknown) {
            dispatch({ type: "SET_SENTENCE_ERROR", id: sid, error: e instanceof Error ? e.message : "生成失败" })
        }
    }

    return (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
            <div className="flex items-center gap-2">
                <span className="font-semibold">角色:</span>
                <Select value={state.role} onValueChange={(v) => dispatch({ type: "SET_ROLE", payload: v })}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="选择声音" />
                    </SelectTrigger>
                    <SelectContent>
                        {voiceGroups.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}-{v.description}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 句子列表 */}
            {state.sentences.map((s) => (
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
