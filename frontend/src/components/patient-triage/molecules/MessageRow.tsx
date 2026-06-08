import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/triage";

interface MessageRowProps {
  message: ChatMessage;
}

export function MessageRow({ message }: MessageRowProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-tr-md bg-primary text-primary-foreground"
            : "rounded-tl-md border border-border/60 bg-card text-foreground",
        )}
      >
        <span>{message.content}</span>
        {message.streaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
        ) : null}
      </div>
    </div>
  );
}
