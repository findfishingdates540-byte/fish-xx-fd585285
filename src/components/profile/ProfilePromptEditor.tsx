import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, MessageCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ProfilePrompt {
  question: string;
  answer: string;
}

const PROMPT_OPTIONS = [
  "My ideal first date would be...",
  "I'm happiest when...",
  "A fun fact about me...",
  "My biggest catch story...",
  "I'm looking for someone who...",
  "On weekends you'll find me...",
  "My favorite fishing spot is...",
  "I can't live without...",
  "My dream vacation is...",
  "The way to my heart is...",
];

interface ProfilePromptEditorProps {
  prompts: ProfilePrompt[];
  onChange: (prompts: ProfilePrompt[]) => void;
  maxPrompts?: number;
}

export function ProfilePromptEditor({ 
  prompts, 
  onChange, 
  maxPrompts = 3 
}: ProfilePromptEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addPrompt = () => {
    if (prompts.length >= maxPrompts) return;
    const availablePrompts = PROMPT_OPTIONS.filter(
      (p) => !prompts.some((existing) => existing.question === p)
    );
    if (availablePrompts.length === 0) return;
    
    onChange([...prompts, { question: availablePrompts[0], answer: '' }]);
    setEditingIndex(prompts.length);
  };

  const updatePrompt = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...prompts];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removePrompt = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const getAvailableQuestions = (currentQuestion: string) => {
    return PROMPT_OPTIONS.filter(
      (p) => p === currentQuestion || !prompts.some((existing) => existing.question === p)
    );
  };

  return (
    <div className="space-y-4">
      {prompts.map((prompt, index) => (
        <Card key={index} className="relative">
          <button
            onClick={() => removePrompt(index)}
            className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Select
              value={prompt.question}
              onValueChange={(value) => updatePrompt(index, 'question', value)}
            >
              <SelectTrigger className="w-full font-medium">
                <SelectValue placeholder="Select a prompt" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableQuestions(prompt.question).map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={prompt.answer}
              onChange={(e) => updatePrompt(index, 'answer', e.target.value.slice(0, 150))}
              placeholder="Write your answer..."
              className="resize-none min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground text-right">
              {prompt.answer.length}/150
            </p>
          </CardContent>
        </Card>
      ))}

      {prompts.length < maxPrompts && (
        <Button
          variant="outline"
          onClick={addPrompt}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Prompt ({prompts.length}/{maxPrompts})
        </Button>
      )}
    </div>
  );
}

interface ProfilePromptDisplayProps {
  prompts: ProfilePrompt[];
  className?: string;
}

export function ProfilePromptDisplay({ prompts, className }: ProfilePromptDisplayProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className={className}>
      {prompts.filter(p => p.answer).map((prompt, index) => (
        <Card key={index} className="mb-4 last:mb-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-primary">{prompt.question}</p>
                <p className="text-sm text-muted-foreground mt-1">{prompt.answer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
