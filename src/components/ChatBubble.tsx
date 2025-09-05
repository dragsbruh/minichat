import DOMPurify from "dompurify";
import { marked } from "marked";
export type ChatMessageItem = { role: "user" | "assistant"; content: string };

function ChatBubble(item: ChatMessageItem) {
  return (
    <div
      class={`w-full flex ${
        item.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        class={`py-2 px-4 ${
          item.role === "user" ? "bg-bubble-user" : "bg-bubble-assistant"
        } rounded-xl max-w-3/4 text-wrap markdown-content`}
        innerHTML={DOMPurify.sanitize(marked(item.content) as string)}
      ></div>
    </div>
  );
}

export default ChatBubble;
