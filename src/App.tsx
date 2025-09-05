import { marked } from "marked";
import OpenAI from "openai";
import { ArrowUp } from "phosphor-solid";
import {
  createEffect,
  createResource,
  createSignal,
  For,
  Show,
} from "solid-js";
import type { ChatMessageItem } from "./components/ChatBubble";
import ChatBubble from "./components/ChatBubble";

// stupid to have api key client side but probably useful if i implement api keys on opengrall and i wanna track how much usage the public demo had
const API_URL: string = import.meta.env.VITE_API_URL!;
const API_KEY: string | null = import.meta.env.VITE_API_KEY ?? null;
const FOOTER: string | null = import.meta.env.VITE_FOOTER ?? null;

const openai = new OpenAI({
  baseURL: API_URL.startsWith("/")
    ? `${window.location.origin}${API_URL}`
    : API_URL,
  apiKey: API_KEY ?? "no-api-key-configured",
  dangerouslyAllowBrowser: true,
});

function App() {
  let inputElem: HTMLInputElement;

  const [inputText, setInputText] = createSignal("");

  const [lastBotText, setLastBotText] = createSignal("");
  const [isGenerating, setIsGenerating] = createSignal(false);

  const [models] = createResource(() => openai.models.list());
  const [selectedModel, setSelectedModel] = createSignal("");

  createEffect(() => {
    setSelectedModel(models()?.data[0].id ?? "");
  });

  const [conversationHistory, setConversationHistory] = createSignal(
    [] as ChatMessageItem[]
  );

  async function startCompletion() {
    if (inputText().trim() === "") return;
    setConversationHistory([
      ...conversationHistory(),
      { role: "user", content: inputText() },
    ]);
    setInputText("");

    setIsGenerating(true);

    const stream = await openai.chat.completions.create({
      model: selectedModel(),
      messages: conversationHistory(),
      stream: true,
    });

    for await (const chunk of stream) {
      setLastBotText(lastBotText() + (chunk.choices[0].delta.content ?? ""));
    }

    setConversationHistory([
      ...conversationHistory(),
      { role: "assistant", content: lastBotText() },
    ]);
    setIsGenerating(false);
    setLastBotText("");

    inputElem.focus();
  }

  createEffect(() => {
    inputElem.focus();
  });

  return (
    <div class="w-full h-full flex justify-center">
      <div class="w-full max-w-[1440px] flex flex-col justify-between py-4 border-x border-accent-disabled">
        <div class="px-4 py-8 w-full flex justify-between border-b border-accent-disabled items-center">
          <a
            target="_blank"
            href="https://github.com/dragsbruh/minichat"
            class="hover:underline hover:text-accent"
          >
            <h1 class="text-2xl">MiniChat</h1>
          </a>
          <Show when={models()} fallback={<></>}>
            <div class="flex gap-2 items-baseline bg-accent px-4 py-2 rounded-xl cursor-pointer">
              <h3 class="select-none italic">Model:</h3>
              <select
                class="border rounded-xl px-2 border-none cursor-pointer"
                value={selectedModel()}
                onchange={(e) => {
                  setSelectedModel(e.target.value);
                }}
              >
                <For each={models()!.data}>
                  {(item) => <option value={item.id}>{item.id}</option>}
                </For>
              </select>
            </div>
          </Show>
        </div>

        <div class="flex-grow flex flex-col gap-4 overflow-y-auto p-8">
          <Show
            when={conversationHistory().length > 0 || isGenerating()}
            fallback={
              <div class="w-full h-full flex justify-center items-center">
                <p class="text-zinc-600 select-none">No conversation yet</p>
              </div>
            }
          >
            <For each={conversationHistory()}>
              {(item) => <ChatBubble role={item.role} content={item.content} />}
            </For>
            <Show when={isGenerating()}>
              <ChatBubble role={"assistant"} content={lastBotText()} />
            </Show>
          </Show>
        </div>

        <div class="px-4 pt-8 w-full border-t border-accent-disabled flex flex-col">
          <form
            class={`w-full flex-grow rounded-full items-center border ${
              isGenerating() ? "border-accent-disabled" : "border-accent"
            } p-2 flex justify-between`}
            onsubmit={(e) => {
              e.preventDefault();
              startCompletion();
            }}
          >
            <input
              placeholder="Say hi!"
              disabled={isGenerating()}
              class="w-full h-full outline-none px-4"
              value={inputText()}
              onchange={(e) => setInputText(e.target.value)}
              ref={(el) => (inputElem = el)}
            ></input>

            <button
              type="submit"
              class={`rounded-full ${
                isGenerating()
                  ? "bg-accent-disabled"
                  : "bg-accent hover:bg-accent-hover active:bg-accent"
              }  p-2 cursor-pointer`}
              disabled={isGenerating()}
            >
              <ArrowUp size="24" /> {/* or maybe paper plane */}
            </button>
          </form>
          <Show when={FOOTER != null}>
            <div
              class="w-full flex justify-center text-zinc-600 pt-2 markdown-content"
              innerHTML={marked(FOOTER!) as string}
            ></div>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default App;
