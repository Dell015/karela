# Project Icarus 🪶
### Universal Integrity & Logic Auditor

> *"The AI wrote it" is never an acceptable answer. If you can't explain your work, it's not your work.*

> *"Don't just fly. Know how you fly."*
> — Randel Serafica, Lead Architect

---

## Table of Contents

1. [What Is Icarus?](#what-is-icarus)
2. [The Problem It Solves](#the-problem-it-solves)
3. [Why Not Just Use ChatGPT or Claude?](#why-not-just-use-chatgpt-or-claude)
4. [How Icarus Works](#how-icarus-works)
   - [The Audit Flow](#the-audit-flow)
   - [The Batch-Audit Gate](#the-batch-audit-gate)
   - [Wax vs. Feathers](#wax-vs-feathers)
5. [Core Concepts Explained](#core-concepts-explained)
   - [Wax Wings](#wax-wings)
   - [Feathers](#feathers)
   - [Golden Feathers](#golden-feathers)
   - [The Nest Scan (Global Insight)](#the-nest-scan-global-insight)
   - [The Defense Transcript](#the-defense-transcript)
6. [System Architecture](#system-architecture)
7. [Subscription Tiers](#subscription-tiers)
8. [Frequently Asked Questions](#frequently-asked-questions)
9. [Project Status](#project-status)
10. [About the Architect](#about-the-architect)

---

## What Is Icarus?

Icarus is a **Universal Integrity & Logic Auditor** — a web application that challenges you to prove you actually understand the work you submit, whether that work was written by you, assisted by AI, or somewhere in between.

In the myth, Icarus flew with wings built by his father Daedalus. He didn't understand them. So when he flew too close to the sun, the wax melted and he fell.

**In software and academia, this happens every day.** People submit code, reports, and projects built with AI tools they don't fully understand. They fly — until someone asks them to explain it.

Icarus is the sun. It will find out.

But unlike a detector or a plagiarism checker, Icarus doesn't try to *catch* you. It tries to *build* you. Its goal is not to flag AI usage — it's to close the gap between what you submitted and what you actually understand. By the time you pass an Icarus audit, the work is truly yours — because you can explain every decision in it.

---

## The Problem It Solves

The rise of AI coding and writing tools has created a specific crisis: **the understanding gap.**

Anyone can *generate* a working program. Very few can *explain* it.

This matters enormously in:

- **Education** — Students submit AI-generated assignments and pass without gaining the skills the course was meant to teach. Degrees lose meaning.
- **Hiring & Onboarding** — Developers pass technical screenings with AI-assisted code and struggle once they're on the job.
- **Professional Integrity** — Engineers in production environments ship code they can't debug, maintain, or defend.
- **Personal Growth** — Self-taught developers and bootcamp graduates plateau because they optimize for output instead of understanding.

Existing tools don't solve this:

| Existing Approach | What It Does | What It Misses |
|---|---|---|
| AI detectors (GPTZero, etc.) | Tries to identify AI-written text | Punishes AI use instead of testing understanding |
| Static analyzers (SonarQube, ESLint) | Finds code quality issues | Can't tell if a human knows *why* it's broken |
| LLMs (Claude, ChatGPT) | Will help you understand if you ask | Won't refuse to help you; won't enforce accountability |
| Plagiarism checkers | Compares text to known sources | Useless for AI-generated content |

Icarus fills the gap that none of these tools occupy: **it doesn't care if AI helped you. It cares if you understand the result.**

---

## Why Not Just Use ChatGPT or Claude?

This is the most important question to answer honestly, so here it is directly.

**Yes, you can ask Claude or ChatGPT to quiz you on your code.** Nothing stops you. A well-written prompt can produce Socratic questions that challenge your understanding.

Here is why that is not the same thing as Icarus:

### 1. A prompt is not a product. A system is.

Claude is designed to be helpful. If you give a vague answer, Claude will gently guide you toward the right one, offer hints, or move on. It is a servant optimized for your satisfaction. Icarus is a mentor optimized for your growth — and those are fundamentally different goals.

Icarus will not accept a vague answer. It will probe deeper. It will not move to the next question until the current one is resolved. You cannot sweet-talk it or out-prompt it, because the evaluation criteria are built into the system, not into a chat session you control.

### 2. The Batch-Audit Gate cannot be replicated with a prompt.

This is Icarus's core differentiator. When Icarus identifies a flaw in your code, it does not just ask you about it — it **locks the audit**. You cannot receive the next batch of questions until you:

1. Fix the actual source file.
2. Submit the updated file.
3. Have Icarus verify the fix via hash comparison.
4. Successfully defend your understanding of what you changed and why.

No AI chat session enforces this. Claude will happily continue the conversation whether or not you opened your editor. Icarus will not. The Gate is a mechanic, not a prompt — and mechanics cannot be bypassed by clever phrasing.

### 3. Icarus maintains cross-session, cross-file memory.

A standard AI chat has no persistent awareness of your codebase over time. Icarus tracks your history across sessions: which files you've defended, which concepts you've struggled with, which "Complexity Hotspots" recur in your work. Over time, it builds a model of your specific understanding gaps and targets them.

### 4. Icarus produces a verifiable output.

When you complete an audit, Icarus generates a **Defense Transcript** — a structured, verifiable record of every question asked, every answer given, and the final mastery score. This is a document you can show to an employer, an institution, or a client. A chat history is not.

### Summary

| Question | ChatGPT / Claude | Icarus |
|---|---|---|
| Will it quiz me on my code? | Yes, if prompted | Yes, by design |
| Will it accept a vague answer? | Often yes | No |
| Will it stop me from proceeding? | No | Yes — the Gate locks |
| Does it check if I fixed the code? | No | Yes — via file hash |
| Does it remember my history? | Per session only | Across sessions and files |
| Does it produce proof of mastery? | No | Yes — Defense Transcript |
| Can I bypass it with a better prompt? | N/A | No |

---

## How Icarus Works

### The Audit Flow

```
[User uploads file or directory]
         ↓
[Nest Scan: dependency mapping across files]
         ↓
[Complexity Hotspots identified]
         ↓
[Batch of N Socratic questions generated]
         ↓
[Lockdown State: Gate is CLOSED]
         ↓
[User answers questions]
         ↓
    ┌────┴────┐
  [Pass]    [Fail]
    ↓          ↓
[Gate        [Wax meter
 opens]       increases]
    ↓
[User edits source file]
         ↓
[Delta Analyzer: hash comparison]
         ↓
[Structural fix verified + mastery defense verified]
         ↓
[Next Flight begins]
```

Each cycle of questions → answers → code fix → verification is called a **Flight**. A complete audit consists of multiple Flights, ending with the generation of a Defense Transcript.

---

### The Batch-Audit Gate

The Gate is the central mechanic that makes Icarus different from every other tool.

When a batch of questions is generated, the system enters **Lockdown State**:

- No new questions are generated.
- No progress is recorded.
- The audit cannot advance.

The Gate opens only when two conditions are both true:

1. **Structural fix verified:** The source file has been edited and the new file hash differs from the previous one in the expected way. Icarus uses a Delta Analyzer to compare versions and confirm the flaw was addressed — not just that *something* changed.

2. **Mastery defense verified:** The user's explanation of what they changed and why meets the minimum coherence and accuracy threshold established by the auditing engine.

If either condition fails, the Gate stays closed. This is not a penalty — it is the point. The Gate exists because understanding is not free. It has to be earned.

---

### Wax vs. Feathers

Every audit tracks two parallel metrics:

**The Wax Meter (Risk Index)**
Measures logical entropy in the submitted work — unverified claims, vague reasoning, structural inconsistencies, and complexity the user cannot explain. Wax accumulates when:
- A question is answered poorly or incorrectly.
- A structural flaw is identified but not addressed.
- The Delta Analyzer detects superficial changes that don't resolve the underlying issue.

At 100% Wax, the audit enters **Project Meltdown** — a formal audit failure. This is not a punishment. It is an honest signal: this project is not ready to fly.

**The Feather Count (Mastery Index)**
Feathers are earned through successful defenses and verified structural fixes. They represent demonstrated understanding — not confidence, not output volume, but actual mastery of the material submitted.

The ratio of Feathers to Wax at the end of an audit forms the core of the Defense Transcript score.

---

## Core Concepts Explained

### Wax Wings

A **Wax Wing** is any piece of logic, code, or reasoning in your submitted work that you cannot explain or defend. The name comes from the myth: Icarus flew on wings he didn't build and didn't understand. When the conditions changed (the sun), those wings failed him.

In Icarus, a Wax Wing is not necessarily wrong or bad code. It might be correct code written by an AI that you pasted without understanding. It might be a design decision you copied from Stack Overflow without knowing why it works. The problem is not the origin — it is the gap in understanding.

Wax Wings are identified by:
- Cross-file dependency analysis during the Nest Scan.
- Complexity Hotspot detection (functions, modules, or logic chains that are high-risk if misunderstood).
- Socratic questioning that reveals surface-level familiarity without depth.

### Feathers

A **Feather** is earned when you successfully defend your understanding of a Complexity Hotspot — meaning you can explain what the code does, why it was written that way, what would break if it changed, and how it interacts with the rest of the system.

Feathers are not given. They are not awarded for correct outputs. They are awarded for correct *explanations*.

This distinction matters: a working program that you cannot explain is 100% Wax. A program with a minor bug that you can explain thoroughly earns Feathers — because understanding is the goal, not perfection.

### Golden Feathers

A **Golden Feather** is the highest award in an Icarus audit. It is earned by identifying a **Red Herring** — an intentional logical fallacy or trap that Icarus plants in the audit questions.

Icarus occasionally includes questions with flawed premises, misleading assumptions, or technically incorrect statements — not to trick you maliciously, but to test whether you're *thinking* or just *answering*. A user who says "that question contains a flawed assumption — here's why" and is correct earns a Golden Feather.

Golden Feathers are rare and meaningful. They signal not just mastery of the material, but critical thinking under pressure.

### The Nest Scan (Global Insight)

Before any questions are generated, Icarus performs a **Nest Scan** — a user-triggered recursive analysis of the entire submitted directory or repository.

The Nest Scan does not read every file in full. Instead, it:

1. Maps the dependency graph across files (what imports what, what calls what).
2. Identifies **Melt Risks** — files or modules that, if misunderstood, would cause cascading failures elsewhere in the project.
3. Tags **Complexity Hotspots** — functions, classes, or logic blocks that are architecturally significant or technically dense.
4. Builds a structural fingerprint of the project that informs all subsequent audit questions.

The Nest Scan is efficient by design. It analyzes structure and signatures first, pulling full file content only for the specific sections flagged for auditing. This keeps token usage and processing time bounded regardless of project size.

### The Defense Transcript

The **Defense Transcript** is the output of a completed Icarus audit. It is a structured, timestamped document that records:

- The files and directories audited.
- Every Complexity Hotspot identified.
- Every question asked, in sequence.
- Every answer given, with the evaluation result.
- Wax and Feather counts per Flight.
- Final mastery score and audit verdict.
- Any Golden Feathers earned, with the reasoning that earned them.

The Defense Transcript is designed to be **verifiable and shareable**. It is proof of human mastery that cannot be faked by generating output — because the Transcript documents the *process of understanding*, not just the result.

**Who accepts a Defense Transcript?**
This is an open and evolving question. Currently, the Transcript is most useful as:
- A personal record of learning and growth.
- Portfolio evidence for job applications in integrity-conscious organizations.
- Academic honesty documentation when submitted alongside AI-assisted work.

The long-term goal is institutional recognition — partnering with bootcamps, universities, and employers who formally credit the Transcript. This is a network effect that builds over time, not on day one.

---

## System Architecture

Icarus is built as a **decoupled web application** designed for high-concurrency logical auditing.

```
┌─────────────────────────────────────────┐
│              Frontend                   │
│  Angular (TypeScript) + Signals UI      │
│  Reactive state, real-time audit UI     │
└───────────────┬─────────────────────────┘
                │ HTTP / WebSocket
┌───────────────▼─────────────────────────┐
│              Backend                    │
│  FastAPI (Python) — Async Logic Engine  │
│  Universal file parser                  │
│  Delta Analyzer (hash comparison)       │
│  Audit state machine                    │
└──────┬──────────────────┬───────────────┘
       │                  │
┌──────▼──────┐    ┌──────▼──────────────┐
│ AI Layer    │    │ Persistence Layer   │
│ Claude API  │    │ PostgreSQL (Supabase)│
│ LangGraph   │    │ pgvector (semantic  │
│ Multi-agent │    │ history retrieval)  │
│ Socratic    │    └─────────────────────┘
│ auditing    │
└─────────────┘
```

### Component Responsibilities

**Frontend (Angular + TypeScript)**
The user interface handles file uploads, displays audit questions in real-time, renders the Wax/Feather meter, manages Gate state (locked/unlocked), and presents the final Defense Transcript. Built with Angular Signals for reactive, efficient state management without unnecessary re-renders.

**Backend (FastAPI)**
The asynchronous logic engine coordinates the entire audit lifecycle. It receives uploaded files, runs the Nest Scan, manages the audit state machine (active → lockdown → unlocked → next flight), runs the Delta Analyzer on file edits, and serves as the orchestration layer between the frontend and the AI.

FastAPI was chosen for its native async support (critical for concurrent audit sessions), automatic OpenAPI documentation, and Python's strong ecosystem for file parsing and text processing.

**AI Layer (Claude API + LangGraph)**
The intelligence layer. LangGraph orchestrates a multi-agent system where specialized agents handle different parts of the audit:
- A **Scan Agent** analyzes file structure and identifies Complexity Hotspots.
- A **Question Agent** generates contextually appropriate Socratic questions based on the scan results.
- An **Evaluation Agent** scores user answers and determines Wax/Feather outcomes.
- A **Red Herring Agent** occasionally plants intentional logical fallacies to test critical thinking.

**Why Claude?**
Claude was selected for its instruction-following precision, natural Socratic dialogue, and strong code understanding across multiple languages. For cost efficiency, the system routes simpler tasks (question generation for straightforward code) to Claude Haiku and reserves Claude Sonnet for deep architectural analysis and nuanced answer evaluation.

**Persistence (PostgreSQL via Supabase + pgvector)**
All audit sessions, question histories, user answers, file hashes, and Feather/Wax records are stored in PostgreSQL. pgvector enables semantic retrieval — allowing Icarus to surface relevant past audit questions when a user returns to similar code patterns, and to track conceptual gaps across sessions over time rather than treating each audit as isolated.

### Why This Stack?

| Decision | Rationale |
|---|---|
| Angular over React | Stronger TypeScript integration, built-in dependency injection, opinionated structure suits a complex state machine |
| FastAPI over Django/Express | Native async, minimal overhead, Python ecosystem for file parsing |
| LangGraph over single-prompt | Multi-agent coordination enables specialized behavior per audit phase |
| Supabase over raw PostgreSQL | Managed hosting, built-in auth, pgvector support without self-managing extensions |
| pgvector for history | Semantic similarity search enables pattern-based memory across audits, not just keyword matching |

### A Note on MVP vs. Full Architecture

The architecture described above is the **target production system**. The MVP (minimum viable product) used for early validation is intentionally simpler:

- Single-file upload only (no directory scan).
- Fixed batch of 3 questions per audit.
- Basic answer evaluation (no multi-agent routing).
- No persistent cross-session memory.
- Simple hash comparison for the Delta Analyzer.

The MVP exists to validate one thing: **does the Socratic loop change user behavior?** If users who complete an Icarus audit demonstrably understand their code better than before, the core thesis is proven. Architecture complexity is added only after that proof exists.

---

## Subscription Tiers

Icarus uses a tiered subscription model designed to match the user's stage of growth.

| Tier | Name | Tagline | Capability |
|---|---|---|---|
| **Free** | The Grounded | *"For those testing the wind."* | 3 questions/batch · Single file only · No history |
| **Tier 2** | The Sky-Dancer | *"High enough to see, safe enough to stay."* | 10 questions/batch · Folder-level Nest Scan · Basic history |
| **Tier 3** | The Sun-Chaser | *"Logic so hot it rivals the sun."* | Unlimited batches · Full repository scale · Cross-project memory · Defense Transcripts |
| **Tier 4** | The Daedalus | *"The Architect of the Sky."* | Everything in Sun-Chaser · Enterprise-grade · Mandatory Git hooks · Verifiable Transcripts · Team dashboards · Priority support |

### Pricing Philosophy

The free tier (The Grounded) is intentionally limited but **genuinely useful**. A 3-question audit of a single file is enough to experience the core Icarus mechanic and understand what it feels like to be challenged to explain your own work. It is not a teaser — it is a complete, functional audit on a small scale.

Upgrades are unlocked by need, not by artificial restrictions. When a user's project grows beyond a single file, The Sky-Dancer becomes necessary. When they need persistent memory and shareable Transcripts for their portfolio or job search, The Sun-Chaser is the right tier. The Daedalus tier is for institutions and teams where audit integrity is an organizational requirement.

### Institutional Pricing

Bootcamps, universities, and engineering organizations can license Icarus at the institutional level under The Daedalus tier. Institutional licenses include:

- Cohort management (assign audits to groups of students or employees).
- Aggregate reporting (identify systemic understanding gaps across a cohort).
- Mandatory Git hook integration (Icarus runs automatically on every commit, not just when a user chooses to engage).
- Official Defense Transcript verification API (employers and institutions can verify a Transcript's authenticity programmatically).

---

## Frequently Asked Questions

**Is Icarus an AI detector?**

No. Icarus does not attempt to determine whether your work was written by an AI. That question is both technically unreliable and philosophically wrong — AI tools are legitimate, and using them is not the problem. The problem is submitting work you don't understand. Icarus tests understanding, not origin.

**Does Icarus work on any programming language?**

The target is language-agnostic auditing. The Nest Scan uses structural analysis (imports, function signatures, call graphs) rather than language-specific parsing, which means it can build a meaningful dependency map for any text-based code. Question quality may vary by language depending on the underlying AI model's training data, but the audit mechanic itself is universal.

Non-code submissions (essays, reports, design documents) are also supported. The Socratic questions adapt to the content type — asking about logical structure, evidence, and reasoning chains rather than function calls and data flow.

**What if I genuinely don't know the answer to a question?**

Say that. Icarus is a mentor, not a gotcha machine. If you answer "I don't know — I copied this from a tutorial and don't understand it," Icarus will treat that as an honest response and shift into teaching mode: explaining the concept, asking a simpler follow-up, and giving you a path to earning the Feather on a second attempt.

What Icarus will not accept is a *confident wrong answer* or a *vague non-answer*. Guessing and bluffing increases your Wax meter. Honest admission of ignorance does not.

**Can I cheat Icarus by asking another AI to answer the questions for it?**

You can type an AI-generated answer into Icarus. Icarus will then ask follow-up questions that probe the specific reasoning behind that answer — questions that require genuine understanding to answer coherently. An AI can generate a plausible-sounding answer to "explain this function." It cannot generate a plausible-sounding answer to "you said the function does X for reason Y — what specifically breaks in module Z if that assumption is wrong?" — because that question is generated from *your specific codebase*, not from general knowledge.

This is why the Nest Scan exists. The cross-file context makes questions hyper-specific to your project, which makes generic AI-assisted cheating progressively harder to sustain across a full audit.

**Does Icarus store my code?**

Uploaded files are used for the audit session and stored only to the extent necessary for the Delta Analyzer (comparing versions) and cross-session memory (tracking which files and concepts have been audited before). Files are not used to train any AI model. Enterprise and institutional users have additional data residency and deletion controls available under The Daedalus tier.

A full privacy policy will be published before public launch.

**What happens during a Project Meltdown?**

When the Wax meter reaches 100%, the audit ends in formal failure. This means:

- No Defense Transcript is issued.
- The Wax breakdown is saved to your history so you can identify which areas need the most work.
- You can restart the audit from the beginning on the same files.
- The Meltdown record is private — it is not shared or visible to anyone else.

Meltdown is not a punishment. It is information. A 100% Wax project tells you exactly what you need to learn before submitting that work anywhere it matters.

**How does Icarus handle very large repositories?**

The Nest Scan is designed to be efficient at scale. It does not send entire repositories to the AI. Instead:

1. It reads file structure and dependency metadata (fast, cheap).
2. It identifies the highest-risk files based on dependency centrality and complexity signals.
3. It reads only the flagged sections in full for question generation.

In practice, a large repository will generate audit batches focused on the most architecturally significant files, not every file. Full repository auditing across all files is available at the Sun-Chaser and Daedalus tiers and is handled as a background job rather than a blocking operation.

**How is the Feather score calculated?**

The final Feather score is not a simple percentage. It weights:

- The **complexity** of the Hotspots defended (defending a core architectural decision earns more than defending a utility function).
- The **quality** of explanations (specificity, accuracy, and demonstrated understanding of consequences).
- The **number of Golden Feathers** earned (each one provides a significant bonus).
- The **Wax remaining** at audit completion (unresolved Wax reduces the final score).

The exact weighting formula will be published as part of the technical documentation before public launch.

**Who built this?**

Randel Serafica, a 3rd-year Computer Science student and lead architect of Project Icarus. The project was conceived and is being developed as a capstone submission for the Philippine Startup Challenge 11, with the goal of becoming a real, funded product.

The project was built on a core conviction: in an age where anyone can generate, the ability to *explain* is the skill that actually matters.

---

## Project Status

Icarus is currently in **pre-MVP development**.

| Phase | Status | Description |
|---|---|---|
| Concept & Architecture | ✅ Complete | Core mechanics, system design, and audit flow defined |
| MVP Scope Definition | ✅ Complete | Single-file auditing, 3-question batches, basic Gate |
| MVP Development | 🔄 In Progress | Core Socratic loop implementation |
| MVP Validation | ⏳ Upcoming | Testing with real users; target: 10+ developers |
| Institutional Pilot | ⏳ Upcoming | One bootcamp or academic cohort as early adopter |
| Public Beta | ⏳ Planned | Tiered access with free tier open to public |
| Philippine Startup Challenge 11 | 🎯 Target | Competition submission deadline |

### Known Open Questions

These are honest gaps in the current design that are actively being worked through:

1. **Defense Transcript recognition** — The Transcript is only as valuable as the institutions that accept it. Building that network is a go-to-market challenge, not a technical one.
2. **AI cost at scale** — Free tier audits cost money. The sustainable unit economics of the free tier need to be validated against real usage data before scaling.
3. **Answer evaluation accuracy** — The AI evaluation of user answers will not be perfect. A feedback mechanism (users can flag unfair evaluations) is planned for the MVP to build a correction dataset.
4. **Multilingual support** — The current design assumes English-language interactions. Filipino and other language support is on the roadmap.

---

## About the Architect

**Randel Serafica**
3rd-year Computer Science student · Lead Architect, Project Icarus

Randel started Icarus as a direct response to his own experience: the moment he decided to stop vibecoding — generating code he couldn't explain — and start actually learning what he was building. Icarus is the tool he wished had existed to force him to earn his understanding earlier.

The project is his capstone submission for the **Philippine Startup Challenge 11**, and his ambition for it extends beyond the competition: to build something that genuinely changes how the next generation of developers and students relates to AI-assisted work.

---

*Project Icarus — Philippine Startup Challenge 11*
*"In an age where anyone can generate, few can explain."*
