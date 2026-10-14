"use client";

import * as React from "react";
import {
  Check as CheckIcon,
  Copy as CopyIcon,
  History as HistoryIcon,
  Plus as PlusIcon,
  RotateCcw as RotateCcwIcon,
} from "honestui/icons";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import type { HostedPlaygroundModel, PlaygroundProvider } from "@/lib/playground-provider";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/registry/ai/chat-thread";
import { ContextMeter } from "@/registry/ai/context-meter";
import { MessageScroller } from "@/registry/ai/message-scroller";
import { PromptBar } from "@/registry/ai/prompt-bar";
import { LoadingState } from "@/registry/ai/loading-state";
import { honestChatLibrary } from "@/registry/generative";
import { honestChatPromptOptions } from "@/registry/generative/catalog";
import {
  AssistantResponse,
  UserMessageContent,
  ChatProvider,
  useThread,
  useThreadList,
} from "@/registry/generative/chat";
import { useChatStore } from "@/registry/generative/runtime/headless/store/ChatContext";

import { createHostedLLM } from "./hosted";
import { ModelIcon } from "./model-icon";
import {
  CONTEXT_TOKENS,
  OLLAMA_URL,
  createOllamaLLM,
  listOllamaModels,
  type OllamaModel,
} from "./ollama";

const OLLAMA_HOST = new URL(OLLAMA_URL).host;
const MODEL_STORAGE_KEY = "honest-ai:playground-model";
const ORIGINS_HELP_URL =
  "https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama";

const STARTERS = [
  "Explain how DNS resolves a domain name",
  "Compare SQLite and Postgres",
  "Build a sign-up form for a pottery class",
  "Chart a sample monthly budget",
];

/** Messages and the composer share one reading column. */
const column = "mx-auto w-full max-w-3xl";

type Connection =
  | { status: "checking" }
  | { status: "unreachable" }
  | { status: "ready"; models: OllamaModel[] };

function useOllamaModels() {
  const [connection, setConnection] = React.useState<Connection>({
    status: "checking",
  });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    listOllamaModels(controller.signal)
      .then((models) => setConnection({ status: "ready", models }))
      .catch(() => {
        if (!controller.signal.aborted)
          setConnection({ status: "unreachable" });
      });
    return () => controller.abort();
  }, [attempt]);

  /** Checks again in the background, keeping the current models on screen. */
  const refresh = React.useCallback(
    () => setAttempt((current) => current + 1),
    [],
  );
  const recheck = React.useCallback(() => {
    setConnection({ status: "checking" });
    refresh();
  }, [refresh]);

  return { connection, recheck, refresh };
}

function readStoredModel() {
  try {
    return window.localStorage.getItem(MODEL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeModel(model: string) {
  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, model);
  } catch {
    // Storage can be blocked. The choice then lasts until the page reloads.
  }
}

/** Ollama accepts these origins without `OLLAMA_ORIGINS`. */
function isLocalOrigin() {
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname,
  );
}

const code =
  "rounded-sm bg-muted px-1 py-0.5 font-mono text-xs text-foreground";

function ConnectionNotice({
  connection,
  onRecheck,
}: {
  connection: Connection;
  onRecheck: () => void;
}) {
  if (connection.status === "checking") return null;

  if (connection.status === "ready") {
    return (
      <Alert className="text-left">
        <AlertTitle>Ollama has no chat model installed</AlertTitle>
        <AlertDescription>
          <p>
            Run <code className={code}>ollama pull</code> with a model from the{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="https://ollama.com/library"
            >
              Ollama library
            </a>
            , then check again.
          </p>
        </AlertDescription>
        <AlertAction>
          <Button variant="secondary" size="sm" onClick={onRecheck}>
            Check again
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  return (
    <Alert variant="error" className="text-left">
      <AlertTitle>Can’t reach Ollama at {OLLAMA_HOST}</AlertTitle>
      <AlertDescription>
        {isLocalOrigin() ? (
          <p>
            Start the Ollama app, or run{" "}
            <code className={code}>ollama serve</code> in a terminal, then check
            again.
          </p>
        ) : (
          <>
            <p>
              This page talks to Ollama on your own computer. Ollama has to be
              running, and it has to allow requests from this site. Quit Ollama,
              then start it with:
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs text-foreground">
              OLLAMA_ORIGINS={window.location.origin} ollama serve
            </pre>
            <p>
              If your browser asks to let this site reach apps on your device,
              allow it.{" "}
              <a
                className="text-foreground underline underline-offset-4"
                href={ORIGINS_HELP_URL}
              >
                Setting origins for the Ollama app
              </a>
            </p>
          </>
        )}
      </AlertDescription>
      <AlertAction>
        <Button variant="secondary" size="sm" onClick={onRecheck}>
          Check again
        </Button>
      </AlertAction>
    </Alert>
  );
}

const COPIED_MILLISECONDS = 2000;

/** Copy for any finished reply, and Regenerate for the newest one. */
function ReplyActions({
  text,
  onRegenerate,
}: {
  text: string;
  /** Omitted when the reply cannot be regenerated. */
  onRegenerate?: () => void;
}) {
  const [copyState, setCopyState] = React.useState<
    "idle" | "copied" | "failed"
  >("idle");
  const resetTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(
      () => setCopyState("idle"),
      COPIED_MILLISECONDS,
    );
  };

  return (
    <div
      data-slot="reply-actions"
      className="flex items-center gap-1 text-muted-foreground"
    >
      <Button
        variant="link"
        size="icon-sm"
        aria-label="Copy reply"
        title="Copy reply"
        onClick={() => void copy()}
      >
        {copyState === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
      </Button>
      {onRegenerate && (
        <Button
          variant="link"
          size="icon-sm"
          aria-label="Regenerate reply"
          title="Regenerate reply"
          onClick={onRegenerate}
        >
          <RotateCcwIcon aria-hidden="true" />
        </Button>
      )}
      <span role="status" className="text-xs">
        {copyState === "copied"
          ? "Copied"
          : copyState === "failed"
            ? "Copy failed. Select the text to copy it."
            : ""}
      </span>
    </div>
  );
}

function Conversation({
  connection,
  onRecheck,
  onReplyFailed,
  model,
  onModelChange,
  context,
  onThreadChange,
  footnote,
}: {
  connection: Connection;
  onRecheck: () => void;
  onReplyFailed?: () => void;
  model: string | undefined;
  onModelChange?: (model: string) => void;
  /** Token counts the model reported for this conversation. Omitted until it reports them. */
  context?: { used: number; limit: number; countedBy: string };
  /** Called when the person leaves the conversation for another one. */
  onThreadChange?: () => void;
  /** A line under the composer, such as where messages are sent. */
  footnote?: React.ReactNode;
}) {
  const thread = useThread();
  const threads = useThreadList();
  const store = useChatStore();
  const canceled = React.useRef(false);
  const [prompt, setPrompt] = React.useState("");

  const models = connection.status === "ready" ? connection.models : [];
  const canChat = model !== undefined;
  const needsNotice =
    connection.status === "unreachable" ||
    (connection.status === "ready" && models.length === 0);

  const visibleMessages = thread.messages.filter(
    (message) => message.role === "user" || message.role === "assistant",
  );
  const lastMessage = visibleMessages.at(-1);
  const isWaitingForFirstToken =
    thread.isRunning && lastMessage?.role === "user";

  const send = (text: string) => {
    canceled.current = false;
    void thread.processMessage({ role: "user", content: text }).then(() => {
      const failed = store.getState().threadError !== null;
      // A failed or stopped message goes back in the composer for another try.
      setPrompt(failed || canceled.current ? text : "");
      if (failed) onReplyFailed?.();
    });
  };

  /** Drops the newest exchange and sends its message again. */
  const regenerate = () => {
    const asked = thread.messages.findLastIndex(
      (message) => message.role === "user",
    );
    const question = thread.messages[asked];
    if (typeof question?.content !== "string") return;
    thread.setMessages(thread.messages.slice(0, asked));
    send(question.content);
  };

  const isEmpty = visibleMessages.length === 0 && !thread.isLoadingMessages;

  // The composer floats over the conversation, so the messages need room
  // under them equal to its height, which changes as the prompt grows.
  const composerRef = React.useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = React.useState(0);
  React.useEffect(() => {
    const element = composerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setComposerHeight(entry.borderBoxSize[0].blockSize),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isEmpty]);

  const composer = (
    <div className="grid gap-2">
      {needsNotice && (
        <ConnectionNotice connection={connection} onRecheck={onRecheck} />
      )}
      {thread.threadError && connection.status !== "unreachable" && (
        <Alert variant="error" className="text-left">
          <AlertTitle>The reply didn’t finish</AlertTitle>
          <AlertDescription>
            <p>{thread.threadError.message}</p>
            <p>
              Your message is preserved in the box below.
            </p>
          </AlertDescription>
        </Alert>
      )}
      <PromptBar
        // Quieter than the bar's default edge, and a step above the generated
        // cards' so the input still reads as a field. The accent border on
        // focus is the bar's own and still applies.
        // Send is a circle here, beside the meter's ring. It is the last control.
        className="[&_[data-slot=prompt-bar-actions]>button:last-child]:rounded-full [&>[data-slot=prompt-bar-field]:not(:focus-within)]:border-foreground/14"
        value={prompt}
        onValueChange={setPrompt}
        placeholder="Ask a question or describe what you want to see"
        disabled={!canChat || thread.isRunning || thread.isLoadingMessages}
        models={models.map((item) => ({
          id: item.name,
          label: item.name,
          icon: <ModelIcon model={item.name} />,
          description: item.parameterSize,
        }))}
        model={model}
        onModelChange={onModelChange}
        onStop={
          thread.isRunning
            ? () => {
                canceled.current = true;
                thread.cancelMessage();
              }
            : undefined
        }
        onSubmit={({ text }) => send(text)}
        actions={
          context && (
            <ContextMeter
              used={context.used}
              limit={context.limit}
              showPercent={false}
              note={`Counted by ${context.countedBy} after the last reply. It includes the playground’s instructions to the model.`}
            />
          )
        }
      />
    </div>
  );

  return (
    <div
      data-slot="playground"
      // From `sm` up the docs header is a transparent 35px strip, so the
      // playground runs underneath it and messages scroll to the top edge.
      className="@container relative mt-14 flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col sm:-mt-[35px] sm:h-[calc(100dvh-1rem)]"
    >
      <h1 className="sr-only">Playground</h1>
      {/*
        Thread controls. Where the panel is wide enough they float in the
        gutter beside the message column, so messages scroll to the top edge
        and never pass under them. Narrower, they take a row of their own.
      */}
      <div className="flex min-h-8 items-center justify-end gap-2 px-4 pt-3 sm:px-6 sm:pt-[47px] @5xl:absolute @5xl:top-[55px] @5xl:right-6 @5xl:z-10 @5xl:p-0">
        {threads.threads.length > 0 && (
          <Menu>
            <MenuTrigger
              disabled={thread.isRunning}
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Conversation history"
                  title="Conversation history"
                />
              }
            >
              <HistoryIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="end" className="max-w-72 min-w-48">
              <MenuRadioGroup
                value={threads.selectedThreadId ?? ""}
                onValueChange={(value) => {
                  onThreadChange?.();
                  threads.selectThread(String(value));
                }}
              >
                {threads.threads.map((item) => (
                  <MenuRadioItem key={item.id} value={item.id}>
                    <span className="block min-w-0 truncate">{item.title}</span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuPopup>
          </Menu>
        )}
        {visibleMessages.length > 0 && (
          <Button
            variant="secondary"
            size="icon"
            className="size-8 shrink-0"
            aria-label="New chat"
            title="New chat"
            disabled={thread.isRunning}
            onClick={() => {
              onThreadChange?.();
              threads.switchToNewThread();
            }}
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        )}
      </div>

      {isEmpty ? (
        // Before the first message the composer is the page: it sits in the
        // middle with the starters under it, then moves down for the chat.
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-3">
          <div className="m-auto grid w-full max-w-2xl gap-6 py-6">
            {/* The site's h2 rule is not in a layer, so only important utilities can size this. */}
            <h2 className="m-0 text-center text-2xl! leading-8! font-medium text-foreground">
              What do you want to see?
            </h2>
            {composer}
            {canChat && (
              <ul
                aria-label="Example prompts"
                className="m-0 flex list-none flex-wrap justify-center gap-2 p-0"
              >
                {STARTERS.map((starter) => (
                  <li key={starter}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                      onClick={() => send(starter)}
                    >
                      {starter}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {footnote}
        </div>
      ) : (
        <div
          className="relative flex min-h-0 flex-1 flex-col"
          style={
            {
              "--composer-height": `${composerHeight}px`,
            } as React.CSSProperties
          }
        >
          <MessageScroller
            key={threads.selectedThreadId ?? "new"}
            label="Playground conversation"
            navigation="rail"
            busy={thread.isRunning || thread.isLoadingMessages}
            className="flex-1"
            viewportClassName="no-scrollbar relative"
            // With floating controls, the first message starts below the docs header.
            contentClassName="flex min-h-full flex-col gap-[var(--hui-space-5)] p-[var(--hui-space-5)] pb-[calc(var(--composer-height)+var(--hui-space-5))] @5xl:pt-14"
          >
            {[
              ...visibleMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  data-slot="message"
                  data-from={message.role}
                  className={column}
                  role={message.role === "user" ? "user" : "assistant"}
                  author={message.role === "user" ? "You" : "Assistant"}
                  hideAuthor
                >
                  {message.role === "assistant" ? (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
                      <div data-slot="message-content">
                        <AssistantResponse
                          message={message}
                          messages={thread.messages}
                          streaming={
                            thread.isRunning && message === lastMessage
                          }
                        />
                      </div>
                      {typeof message.content === "string" &&
                        !(thread.isRunning && message === lastMessage) && (
                          <ReplyActions
                            text={message.content}
                            onRegenerate={
                              message === lastMessage &&
                              canChat &&
                              !thread.isRunning
                                ? regenerate
                                : undefined
                            }
                          />
                        )}
                    </div>
                  ) : (
                    <div data-slot="message-content">
                      <UserMessageContent content={typeof message.content === "string" ? message.content : ""} />
                    </div>
                  )}
                </ChatMessage>
              )),
              ...(isWaitingForFirstToken
                ? [
                    <div key="waiting" className={column}>
                      <LoadingState
                        label={`Waiting for ${model}`}
                      />
                    </div>,
                  ]
                : []),
            ]}
          </MessageScroller>
          {/*
            Messages scroll behind the composer instead of stopping at a line
            above it. Nothing is drawn behind it, so they show around it.
          */}
          <div
            ref={composerRef}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-[var(--hui-space-3)] pt-0"
          >
            <div className={cn(column, "pointer-events-auto grid gap-2")}>
              {composer}
              {footnote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Replies come from the visitor's own Ollama, straight from the browser. */
function OllamaPlayground() {
  const { connection, recheck, refresh } = useOllamaModels();
  const [chosenModel, setChosenModel] = React.useState<string | null>(null);
  // Unknown until a reply ends, and again after anything that changes the count.
  const [contextUsed, setContextUsed] = React.useState<number | null>(null);

  const models = connection.status === "ready" ? connection.models : [];
  const preferred =
    chosenModel ?? (models.length > 0 ? readStoredModel() : null);
  const model = (models.find((item) => item.name === preferred) ?? models.at(0))
    ?.name;

  const llm = React.useMemo(
    () =>
      createOllamaLLM({
        // Sending is disabled until a model is known.
        model: model ?? "",
        systemPrompt: honestChatLibrary.prompt(honestChatPromptOptions),
        onContextUsed: setContextUsed,
      }),
    [model],
  );

  return (
    <ChatProvider llm={llm}>
      <Conversation
        connection={connection}
        onRecheck={recheck}
        // The failure may mean Ollama stopped, so the connection is checked again.
        onReplyFailed={refresh}
        model={model}
        onModelChange={(next) => {
          setChosenModel(next);
          storeModel(next);
          // Each model counts tokens its own way.
          setContextUsed(null);
        }}
        context={
          contextUsed === null
            ? undefined
            : {
                used: contextUsed,
                limit: CONTEXT_TOKENS,
                countedBy: "Ollama",
              }
        }
        onThreadChange={() => setContextUsed(null)}
      />
    </ChatProvider>
  );
}

/** Replies come from this site's server, which holds the model credentials. */
function HostedPlayground({
  model: initialModel,
  contextTokens,
  models,
}: {
  model: string;
  /** The model's context window. Without it there is no meter. */
  contextTokens?: number;
  models?: HostedPlaygroundModel[];
}) {
  const [model, setModel] = React.useState(initialModel);
  const selected = models?.find((item) => item.model === model);
  const contextLimit = selected?.contextTokens ?? (model === initialModel ? contextTokens : undefined);
  const [contextUsed, setContextUsed] = React.useState<number | null>(null);
  const llm = React.useMemo(
    () => createHostedLLM({ model, onContextUsed: setContextUsed }),
    [model],
  );
  const connection = React.useMemo<Connection>(
    () => ({ status: "ready", models: models?.map((item) => ({ name: item.model })) ?? [{ name: initialModel }] }),
    [models, initialModel],
  );
  return (
    <ChatProvider llm={llm}>
      <Conversation
        connection={connection}
        // The server is always the same one, so there is nothing to check again.
        onRecheck={() => {}}
        model={model}
        onModelChange={(nextModel) => {
          setModel(nextModel);
          setContextUsed(null);
        }}
        context={
          contextUsed === null || contextLimit === undefined
            ? undefined
            : { used: contextUsed, limit: contextLimit, countedBy: selected?.provider === "openai" ? "OpenAI" : "Google" }
        }
        onThreadChange={() => setContextUsed(null)}
      />
    </ChatProvider>
  );
}

/** A chat whose replies are Markdown with generated UI inside. */
export function Playground({ provider }: { provider: PlaygroundProvider }) {
  return provider.kind === "hosted" ? (
    <HostedPlayground
      model={provider.model}
      contextTokens={provider.contextTokens}
      models={provider.models}
    />
  ) : (
    <OllamaPlayground />
  );
}
