import * as React from "react";
import Link from "next/link";

import { LandingExchange } from "@/components/landing/exchange";
import {
  AgentRunSample,
  ContextCardsSample,
  DiffTableSample,
  MarkdownSample,
  TaskRowsSample,
} from "@/components/landing/samples";
import { landingTopics, type LandingTopicId } from "@/components/landing/topics";
import { HONEST_UI_URL } from "@/globals/constants/site";
import { CodeView } from "@/registry/ai/code-view";
import ApprovalCardDemo from "@/registry/examples/approval-card-demo";

// What "renders the state you pass in" looks like in an application.
const stateExample = `<ThinkingState status={run.status} label={run.label} />
<ToolChips
  summary={run.summary}
  calls={run.calls}
  changes={run.changes}
/>`;

const installCommands = `npx honestui@latest init
npx honestui@latest add https://ai.honestui.com/r/prompt-bar.json`;

type ComponentLink = { name: string; slug: string };

type ComponentGroup = {
  name: string;
  /** Completes "{name} covers ...". */
  covers: string;
  components: ComponentLink[];
  /** Introduces the group's sample, as a sentence that ends in a colon. */
  sampleIntro: React.ReactNode;
  sample: React.ReactNode;
  sampleNote: string;
  /** Set when the sample is itself Prose, such as rendered Markdown. */
  sampleRendersProse?: boolean;
};

const componentGroups: ComponentGroup[] = [
  {
    name: "Conversation",
    covers: "the prompt, the thread, and the reply",
    components: [
      { name: "Prompt Bar", slug: "prompt-bar" },
      { name: "Chat Thread", slug: "chat-thread" },
      { name: "Message Scroller", slug: "message-scroller" },
      { name: "Streaming Text", slug: "streaming-text" },
      { name: "Markdown", slug: "markdown" },
      { name: "Context Meter", slug: "context-meter" },
      { name: "Sidebar Nav", slug: "sidebar-nav" },
      { name: "Search List", slug: "search-list" },
    ],
    sampleIntro: "Markdown, for example, renders a reply's Markdown, including Markdown that is still arriving:",
    sample: <MarkdownSample />,
    sampleNote: "A sample reply, rendered from a Markdown string.",
    sampleRendersProse: true,
  },
  {
    name: "Agent activity",
    covers: "what the agent is doing while it works",
    components: [
      { name: "Thinking State", slug: "thinking-state" },
      { name: "Loading State", slug: "loading-state" },
      { name: "Tool Chips", slug: "tool-chips" },
      { name: "Task Rows", slug: "task-rows" },
      { name: "Agent Screen", slug: "agent-screen" },
      { name: "Flowchart", slug: "flowchart" },
    ],
    sampleIntro: "Task Rows lists the tasks in a run with the status of each:",
    sample: <TaskRowsSample />,
    sampleNote: "Sample tasks. No agent runs here; Retry moves the failed task to running.",
  },
  {
    name: "Decisions",
    covers: "the questions and proposals a person answers before the agent continues",
    components: [
      { name: "Approval Card", slug: "approval-card" },
      { name: "Recommendation Card", slug: "recommendation-card" },
      { name: "Diff Table", slug: "diff-table" },
      { name: "Selection Actions", slug: "selection-actions" },
      { name: "Fine-tune Card", slug: "fine-tune-card" },
    ],
    sampleIntro: "Diff Table lets a person review the rows an agent proposes to add or remove:",
    sample: <DiffTableSample />,
    sampleNote: "Sample rows. This table applies nothing; it shows the row ids your handler receives.",
  },
  {
    name: "Results",
    covers: "what the agent found or made",
    components: [
      { name: "Context Cards", slug: "context-cards" },
      { name: "Code View", slug: "code-view" },
      { name: "Artifact Panel", slug: "artifact-panel" },
      { name: "Records Table", slug: "records-table" },
      { name: "Filter Table", slug: "filter-table" },
      { name: "Insight Cards", slug: "insight-cards" },
    ],
    sampleIntro: "Context Cards shows the passages an agent retrieved, with their sources:",
    sample: <ContextCardsSample />,
    sampleNote: "Sample passages.",
  },
];

/**
 * A live component inside an answer. Prose sets the figure's place in the
 * flow and its caption; `not-prose` keeps the component's own styles.
 */
function Sample({
  note,
  rendersProse = false,
  children,
}: {
  note: string;
  /** Set for a sample that is itself Prose, such as rendered Markdown. */
  rendersProse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <figure>
      {rendersProse ? children : <div className="not-prose">{children}</div>}
      <figcaption>{note}</figcaption>
    </figure>
  );
}

type Answer = {
  /** The first paragraph, as plain text. A replay streams it. */
  lead: string;
  body: React.ReactNode;
};

const answers: Record<LandingTopicId, Answer> = {
  what: {
    lead: "It is the interface an agent or chat product needs around its model. Here is one agent run built from its components. It waits for you at the recommendation, so choose an option to see the rest.",
    body: (
      <>
        <Sample note="Sample run on a timer; no agent or model is running. It uses Chat Thread messages, Thinking State, and Recommendation Card, then Tool Chips and Code View once you accept.">
          <AgentRunSample />
        </Sample>
        <p>
          Those are the pieces Honest AI covers: a field for the prompt, a
          trace of what the agent is doing, a record of the tools it called,
          and a way to ask the person a question before it acts.
        </p>
        <p>
          Honest AI is built on <a href={HONEST_UI_URL}>Honest UI</a> and
          released under the MIT license. The Honest UI CLI copies each
          component&rsquo;s source into your project, so you can change it
          directly.
        </p>
      </>
    ),
  },
  model: {
    lead: "No. Each component renders the state you pass in. None of them calls a model, streams a reply, or runs a tool. Your application does that work and passes the result as props, so a component never shows progress your application did not report.",
    body: (
      <>
        <p>
          In the run above,{" "}
          <Link href="/docs/components/thinking-state">Thinking State</Link>{" "}
          and <Link href="/docs/components/tool-chips">Tool Chips</Link> are
          given their status, steps, and calls like this:
        </p>
        <div className="not-prose">
          <CodeView filename="agent-run.tsx" code={stateExample} />
        </div>
        <p>
          The model, the transport, the state, and the failure handling stay
          in your application. The documentation lists{" "}
          <Link href="/docs#what-your-application-supplies">
            what your application supplies
          </Link>
          .
        </p>
      </>
    ),
  },
  components: {
    lead: "The components fall into four groups: conversation, agent activity, decisions, and results. Here is each group, with one of its components running on sample data.",
    body: (
      <>
        {componentGroups.map((group) => (
          <React.Fragment key={group.name}>
            <p>
              <strong>{group.name}</strong> covers {group.covers}:{" "}
              {group.components.map((component, index) => (
                <React.Fragment key={component.slug}>
                  {index > 0 && ", "}
                  <Link href={`/docs/components/${component.slug}`}>{component.name}</Link>
                </React.Fragment>
              ))}
              . {group.sampleIntro}
            </p>
            <Sample note={group.sampleNote} rendersProse={group.sampleRendersProse}>
              {group.sample}
            </Sample>
          </React.Fragment>
        ))}
        <p>
          <Link href="/docs/prose">Prose</Link> is a separate stylesheet for
          rendered Markdown or plain HTML. It works without React, Tailwind,
          or Honest UI, and it sets the text of these answers.
        </p>
      </>
    ),
  },
  install: {
    lead: "Use the Honest UI CLI. It copies the component into components/ai, adds the Honest UI components it imports under components/ui, and installs the packages they need.",
    body: (
      <>
        <div className="not-prose">
          <CodeView filename="Terminal" code={installCommands} />
        </div>
        <p>
          You need Node.js 20.18.1 or later, React 19, and Tailwind CSS v4.
          The first command is only for a project that has no{" "}
          <code>components.json</code> yet. The{" "}
          <Link href="/docs/installation">installation guide</Link> covers
          connecting a component to your agent&rsquo;s state.
        </p>
      </>
    ),
  },
  approvals: {
    lead: "With Approval Card. You pass it the agent’s questions, and it hands the answers to your onSubmit handler. If the promise you return rejects, the card shows an error and keeps what the person chose.",
    body: (
      <>
        <Sample note="Sample questions. This card sends nothing. After you answer, it shows the object your handler would receive.">
          <ApprovalCardDemo />
        </Sample>
        <p>
          The <Link href="/docs/components/approval-card">Approval Card</Link>{" "}
          page documents its props. For a single proposed action, use{" "}
          <Link href="/docs/components/recommendation-card">
            Recommendation Card
          </Link>
          . For rows an agent wants to add or remove, use{" "}
          <Link href="/docs/components/diff-table">Diff Table</Link>.
        </p>
      </>
    ),
  },
  generative: {
    lead: "Yes, with Generative UI. The model returns a text program in Honest AI Lang. Honest AI parses that program and renders it with the components you allow, so a reply can contain a chart, a form, or a set of tabs instead of only a paragraph.",
    body: (
      <>
        <p>
          The renderer interprets the registered language. It does not
          evaluate generated JavaScript. Your application still supplies the
          model endpoint, credentials, storage, and tool implementations.
        </p>
        <p>
          Start with the <Link href="/docs/generative">Generative UI guide</Link>
          . Unlike this page, the{" "}
          <Link href="/docs/generative/playground">
            Generative UI playground
          </Link>{" "}
          connects to a model, so you can see generated replies render.
        </p>
      </>
    ),
  },
  theming: {
    lead: "Yes. The components use Honest UI’s theme tokens and are built from Honest UI components, so a change to your theme or to one of those components carries through. The source is in your project, so you can also edit it.",
    body: (
      <p>
        Each component takes a <code>labels</code> prop for every string it
        writes, including the names read by screen readers. Replace the
        English defaults when you translate.
      </p>
    ),
  },
};

/**
 * The landing page's written conversation. Every answer is in the server's
 * HTML; the components inside the answers are the ones the page describes.
 */
export function LandingConversation() {
  return (
    <div className="flex flex-col gap-[var(--hui-space-12)]">
      {landingTopics.map((topic) => (
        <LandingExchange key={topic.id} topic={topic} lead={answers[topic.id].lead}>
          {answers[topic.id].body}
        </LandingExchange>
      ))}
    </div>
  );
}
