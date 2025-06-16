"use client"

import React, { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useTranslations } from 'next-intl'

interface FunctionAreaProps {
  onGenerate: () => void;
  onDelete: () => void;
  pitch: string;
  onPitchChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  loading?: boolean;
  keepOpen: () => void;
}

function FunctionArea({
  onGenerate,
  onDelete,
  pitch,
  onPitchChange,
  speed,
  onSpeedChange,
  loading,
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
      <Button
        size="sm"
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? t('generating') : t('generate')}
      </Button>
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
      <Button size="sm" variant="destructive" onClick={onDelete}>{t('delete')}</Button>
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function SentenceBlock({
  value, onChange, onGenerate, onDelete,
  pitch, onPitchChange, speed, onSpeedChange, loading, onKeyDown, audioUrl
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showFunctions, setShowFunctions] = useState(false)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

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

  return (
    <div
      className="flex flex-col gap-1 border rounded p-2 hover:bg-gray-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showFunctions && (
        <FunctionArea
          onGenerate={onGenerate}
          onDelete={onDelete}
          pitch={pitch}
          onPitchChange={onPitchChange}
          speed={speed}
          onSpeedChange={onSpeedChange}
          loading={loading}
          keepOpen={keepOpen}
        />
      )}
      <Textarea
        ref={textareaRef}
        className="flex-1"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {showFunctions && audioUrl && (
        <audio controls src={audioUrl} className="w-full mt-1" />
      )}
    </div>
  )
}
