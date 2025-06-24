"use client"

import React, { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { Play } from "@/components/ui/Play"

interface FunctionAreaProps {
  pitch: string;
  onPitchChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  keepOpen: () => void;
}

function FunctionArea({
  pitch,
  onPitchChange,
  speed,
  onSpeedChange,
  keepOpen,
}: FunctionAreaProps) {
  const t = useTranslations('SentenceBlock')

  return (
    <div
      className="flex items-center gap-2 mb-1"
      onPointerDownCapture={(e) => {
        e.stopPropagation();
        keepOpen();
      }}
    >
      <Select value={pitch} onValueChange={onPitchChange} onOpenChange={() => setTimeout(() => keepOpen(), 0)}>
        <SelectTrigger className="w-20"><SelectValue placeholder={t('pitch.label')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">{t('pitch.low')}</SelectItem>
          <SelectItem value="normal">{t('pitch.normal')}</SelectItem>
          <SelectItem value="high">{t('pitch.high')}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={speed} onValueChange={onSpeedChange} onOpenChange={() => setTimeout(() => keepOpen(), 0)}>
        <SelectTrigger className="w-20"><SelectValue placeholder={t('speed.label')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="slow">{t('speed.slow')}</SelectItem>
          <SelectItem value="normal">{t('speed.normal')}</SelectItem>
          <SelectItem value="fast">{t('speed.fast')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

interface Props {
  value: string;
  audioUrl?: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  onDelete: () => void;
  pitch: string;
  onPitchChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  loading?: boolean;
  isPlaying?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSynthesisRequest?: () => Promise<void>;
}

export default function SentenceBlock({
  value, onChange, onGenerate, onDelete,
  pitch, onPitchChange, speed, onSpeedChange, loading, isPlaying, onKeyDown, audioUrl }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [showFunctions, setShowFunctions] = useState(false)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)
  const [isPlayingLocal, setIsPlayingLocal] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowFunctions(true)
  }

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setShowFunctions(false), 200)
  }

  const keepOpen = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowFunctions(true)
  }

  const handlePlayClick = () => {
    if (!audioUrl) {
      onGenerate()
    } else if (audioRef.current) {
      setIsPlayingLocal(true)
      audioRef.current.currentTime = 0
      audioRef.current.play()
      audioRef.current.onended = () => setIsPlayingLocal(false)
      audioRef.current.onerror = () => setIsPlayingLocal(false)
    }
  }

  return (
    <div
      className="border rounded p-2 hover:bg-gray-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center group relative">
        <Textarea
          ref={textareaRef}
          className="flex-1"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex gap-2 ml-2">
          <Button
            size="icon"
            onClick={handlePlayClick}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-transparent shadow-none border-none flex items-center justify-center hover:bg-gray-100"
          >
            {(loading || isPlayingLocal || isPlaying) ? (
              <Play rotate className="text-black" />
            ) : (
              <Play className="text-black" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="w-9 h-9 rounded-full bg-transparent shadow-none border-none flex items-center justify-center hover:bg-gray-100"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </Button>
        </div>
      </div>
      {showFunctions && (
        <div className="mt-2">
          <FunctionArea
            pitch={pitch}
            onPitchChange={onPitchChange}
            speed={speed}
            onSpeedChange={onSpeedChange}
            keepOpen={keepOpen}
          />
        </div>
      )}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
      )}
    </div>
  )
}
