// src/app/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import VoiceBlock from "@/components/VoiceBlock"
import React from "react"
import { useImmerReducer } from "use-immer"

type VoiceBlockData = { id: string; voice: string }
type Action =
  | { type: "ADD_BLOCK" }
  | { type: "REMOVE_BLOCK"; id: string }

function voiceBlockInitial(voice = "alloy"): VoiceBlockData {
  return {
    id: crypto.randomUUID(),
    voice,
  }
}

function reducer(draft: VoiceBlockData[], action: Action): VoiceBlockData[] | void {
  switch (action.type) {
    case "ADD_BLOCK":
      draft.push(voiceBlockInitial())
      break
    case "REMOVE_BLOCK":
      return draft.filter((b) => b.id !== action.id)
    default:
      break
  }
  return draft
}

export default function Home() {
  const [blocks, dispatch] = useImmerReducer(reducer, [voiceBlockInitial()])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8 relative">
      <div className="space-y-6 w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center">文本转语音 (TTS)</h1>
        {/* 语音块列表 */}
        {blocks.map((block) => (
          <div className="relative" key={block.id}>
            <VoiceBlock
              id={block.id}
              voice={block.voice}
            />
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="destructive" onClick={() => dispatch({ type: "REMOVE_BLOCK", id: block.id })}>
                删除
              </Button>
            </div>
          </div>
        ))}
        <div className="flex justify-center">
          <Button onClick={() => dispatch({ type: "ADD_BLOCK" })}>添加 VoiceBlock</Button>
        </div>
      </div>

    </div>
  )
}
