// src/components/SentenceBlock.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type SentenceBlockProps = {
  id: string
  text: string
  onRemove: () => void
  onGenerate: () => void
}

export default function SentenceBlock({ id, text, onRemove, onGenerate }: SentenceBlockProps) {
  return (
    <div className="flex items-center gap-2">
      <Textarea className="flex-1" readOnly value={text} />
      <Button variant="secondary" size="sm" onClick={onGenerate}>生成语音</Button>
      <Button variant="destructive" size="sm" onClick={onRemove}>删除</Button>
    </div>
  )
}
