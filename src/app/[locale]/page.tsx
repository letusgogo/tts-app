// src/app/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import VoiceBlock, { VoiceBlockRef } from "@/components/VoiceBlock"
import React, { useState, useRef } from "react"
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
  const translation = useTranslations();
  const [isMerging, setIsMerging] = useState(false)
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null)
  const [mergeError, setMergeError] = useState<string | null>(null)

  // Create refs for each VoiceBlock
  const voiceBlockRefs = useRef<{ [key: string]: VoiceBlockRef | null }>({})

  async function handleMergeAudio() {
    setIsMerging(true)
    setMergeError(null)
    setMergedAudioUrl(null)

    try {
      // Get all VoiceBlock refs
      const refs = Object.values(voiceBlockRefs.current).filter(ref => ref !== null) as VoiceBlockRef[]

      if (refs.length === 0) {
        throw new Error("No voice blocks available")
      }

      // Call synthesize() on each VoiceBlock
      const synthesisPromises = refs.map(async (ref, index) => {
        try {
          const audioUrl = await ref.synthesize()
          return {
            id: `block-${index}`,
            url: audioUrl
          }
        } catch (error) {
          console.error(`Error synthesizing block ${index}:`, error)
          throw error
        }
      })

      const results = await Promise.all(synthesisPromises)

      // If we have multiple blocks, merge all the synthesized audio
      if (results.length > 1) {
        const audioDatas = results.map(result => {
          const base64 = result.url.split(',')[1]
          return { base64 }
        })

        const mergeRes = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioDatas }),
        })

        if (!mergeRes.ok) {
          throw new Error("Failed to merge audio from multiple blocks")
        }

        const mergeData = await mergeRes.json()
        setMergedAudioUrl(mergeData.synthesisUrl)
      } else if (results.length === 1) {
        // If only one block, use its audio directly
        setMergedAudioUrl(results[0].url)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "合并音频失败"
      setMergeError(errorMessage)
      console.error("Merge audio error:", error)
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8 relative">
      {/* 登录按钮区域 */}
      <div className="absolute top-4 right-8 z-50">
        {session ? (
          <div className="flex items-center gap-2">
            <span>Hi, {session.user?.name || session.user?.email}</span>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => signOut()}>{translation('logout')}</button>
          </div>
        ) : (
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => signIn("casdoor")}>{translation('login')}</button>
        )}
      </div>
      <div className="space-y-6 w-full max-w-2xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center">(TTS)</h1>
        {/* 语音块列表 */}
        {blocks.map((block) => (
          <div className="relative" key={block.id}>
            <VoiceBlock
              key={block.id}
              voice={block.voice}
              ref={(ref) => {
                voiceBlockRefs.current[block.id] = ref
              }}
            />
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="destructive" onClick={() => dispatch({ type: "REMOVE_BLOCK", id: block.id })}>
                {translation('delete')}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex justify-center">
          <Button onClick={() => dispatch({ type: "ADD_BLOCK" })}>{translation('add_voice_block')}</Button>
        </div>

        {/* Merge Audio Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleMergeAudio}
            disabled={isMerging || blocks.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isMerging ? "正在合并音频..." : "合并音频"}
          </Button>
        </div>

        {/* Error Display */}
        {mergeError && (
          <div className="text-red-600 text-center p-4 bg-red-50 rounded">
            合并错误: {mergeError}
          </div>
        )}

        {/* Final Merged Audio Display */}
        {mergedAudioUrl && (
          <div className="text-center p-4 bg-green-50 rounded">
            <h3 className="text-lg font-semibold text-green-800 mb-2">合并成功!</h3>
            <audio controls className="w-full">
              <source src={mergedAudioUrl} type="audio/mp3" />
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}
