"use client"

import { useImmerReducer } from "use-immer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// 替代路径别名以避免构建错误
const voices = ["alloy", "fable", "echo", "onyx", "nova", "shimmer"]
import { useId } from "react"

export type Props = {
    id: string
    voice: string
}

type Sentence = {
    id: string
    text: string
}

type State = {
    voice: string
    input: string
    sentences: Sentence[]
}

type Action =
    | { type: "SET_VOICE"; payload: string }
    | { type: "SET_INPUT"; payload: string }
    | { type: "ADD_SENTENCE" }
    | { type: "REMOVE_SENTENCE"; payload: string }

const initialState = (voice: string): State => ({
    voice,
    input: "",
    sentences: [],
})

function reducer(draft: State, action: Action): void {
    switch (action.type) {
        case "SET_VOICE":
            draft.voice = action.payload
            break
        case "SET_INPUT":
            draft.input = action.payload
            break
        case "ADD_SENTENCE":
            if (draft.input.trim()) {
                draft.sentences.push({ id: crypto.randomUUID(), text: draft.input })
                draft.input = ""
            }
            break
        case "REMOVE_SENTENCE":
            draft.sentences = draft.sentences.filter(s => s.id !== action.payload)
            break
    }
}

export default function VoiceBlock({ id, voice }: Props) {
    const [state, dispatch] = useImmerReducer(reducer, initialState(voice))
    const inputId = useId()

    return (
        <div className="border rounded p-4 bg-gray-50 space-y-3">
            <div className="flex items-center gap-2">
                <span className="font-semibold">角色:</span>
                <Select value={state.voice} onValueChange={(v) => dispatch({ type: "SET_VOICE", payload: v })}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="选择声音" />
                    </SelectTrigger>
                    <SelectContent>
                        {voices.map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 输入区 */}
            <div className="flex items-center gap-2">
                <Textarea
                    className="flex-1"
                    id={inputId}
                    placeholder="请输入句子"
                    value={state.input}
                    onChange={e => dispatch({ type: "SET_INPUT", payload: e.target.value })}
                />
                <Button onClick={() => dispatch({ type: "ADD_SENTENCE" })}>添加</Button>
            </div>

            {/* 句子列表 */}
            {state.sentences.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                    <Textarea className="flex-1" readOnly value={s.text} />
                    <Button variant="secondary" size="sm">生成语音</Button>
                    <Button variant="destructive" size="sm" onClick={() => dispatch({ type: "REMOVE_SENTENCE", payload: s.id })}>删除</Button>
                </div>
            ))}
        </div>
    )
}
