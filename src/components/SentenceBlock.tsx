"use client"

import React, { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = {
  value: string
  audioUrl?: string
  onChange: (val: string) => void
  onGenerate: () => void
  onDelete: () => void
  pitch: string
  onPitchChange: (val: string) => void
  speed: string
  onSpeedChange: (val: string) => void
  loading?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export default function SentenceBlock({
  value, onChange, onGenerate, onDelete,
  pitch, onPitchChange, speed, onSpeedChange, loading, onKeyDown, audioUrl
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  const blurTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  return (
    <div className="flex flex-col gap-1">
      {/* 按钮组：仅聚焦时显示 */}
      {focused && (
        <div className="flex items-center gap-2 mb-1">
          <Button
            size="sm"
            onMouseDown={e => e.preventDefault()}
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? "生成中..." : "生成语音"}
          </Button>
          <Select value={pitch} onValueChange={onPitchChange}>
            <SelectTrigger className="w-20"><SelectValue placeholder="语调" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="normal">正常</SelectItem>
              <SelectItem value="high">高</SelectItem>
            </SelectContent>
          </Select>
          <Select value={speed} onValueChange={onSpeedChange}>
            <SelectTrigger className="w-20"><SelectValue placeholder="语速" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">慢</SelectItem>
              <SelectItem value="normal">正常</SelectItem>
              <SelectItem value="fast">快</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="destructive" onClick={onDelete}>删除</Button>
        </div>
      )}
      {/* 输入区 */}
      <Textarea
        ref={textareaRef}
        className="flex-1"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (blurTimeout.current) clearTimeout(blurTimeout.current)
          setFocused(true)
        }}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setFocused(false), 100)
        }}
      />
      {/* audio 播放器 */}
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full mt-1" />
      )}
    </div>
  )
}
