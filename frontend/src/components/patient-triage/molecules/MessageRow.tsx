import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/store/triageSlice";

interface MessageRowProps {
  message: ChatMessage;
}

export function MessageRow({ message }: MessageRowProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
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
