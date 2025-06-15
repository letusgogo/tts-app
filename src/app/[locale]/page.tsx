// src/app/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import VoiceBlock from "@/components/VoiceBlock"
import React from "react"
import { useImmerReducer } from "use-immer"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTranslations } from 'next-intl';

type VoiceBlockData = { id: string; voice: string }
type Action =
  | { type: "ADD_BLOCK" }
  | { type: "REMOVE_BLOCK"; id: string }

function voiceBlockInitial(voice = "BV421_streaming"): VoiceBlockData {
  return {
    id: crypto.randomUUID(),
    voice
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
  const { data: session } = useSession()
  const [blocks, dispatch] = useImmerReducer(reducer, [voiceBlockInitial()])
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8 relative">
      {/* 登录按钮区域 */}
      <div className="absolute top-4 right-8 z-50">
        {session ? (
          <div className="flex items-center gap-2">
            <span>Hi, {session.user?.name || session.user?.email}</span>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => signOut()}>{t('logout')}</button>
          </div>
        ) : (
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => signIn("casdoor")}>{t('login')}</button>
        )}
      </div>
      <div className="space-y-6 w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center">(TTS)</h1>
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
