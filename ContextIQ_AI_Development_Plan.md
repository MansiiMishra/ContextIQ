# ContextIQ --- AI-Assisted Development Plan

**Document type:** Product brief + implementation plan + AI coding-agent
instructions\
**Status:** Initial development specification\
**Target:** Chrome Extension (Manifest V3)\
**Initial host:** ChatGPT (`chatgpt.com`)\
**Primary goal:** Ship a useful, privacy-first MVP, then validate and
expand it with real user feedback.

------------------------------------------------------------------------

## 1. Product vision

**ContextIQ** is a privacy-first browser extension that helps people use
AI conversations more efficiently without losing important context.

**Positioning:** *Never lose important context. Never waste tokens.*

The product should go beyond a simple token counter. It should help
users understand prompt size, reduce unnecessary wording, preserve
important instructions, and recognize when a long conversation may be
accumulating excessive context.

### Product principles

1.  **User control:** Never silently rewrite or submit a user's prompt.
2.  **Transparency:** Show what changed and why.
3.  **Context preservation:** Do not trade away important requirements
    for token savings.
4.  **Privacy-first:** Prefer local processing; do not send prompt
    content to a server in the MVP.
5.  **Small, shippable increments:** Build and test one capability at a
    time.
6.  **Honest measurement:** Label token counts as estimates unless they
    are calculated with the exact tokenizer and complete model input.

------------------------------------------------------------------------

## 2. Target users and problem

### Initial users

People who regularly use ChatGPT for coding, research, writing,
studying, and long-running tasks.

### Problems to solve

-   Users do not know how large their prompts are.
-   Prompts often contain redundant wording that can be shortened.
-   Users cannot easily tell what a prompt compressor changed.
-   Shortening a prompt can accidentally remove constraints, numbers,
    names, or technical requirements.
-   Long conversations can accumulate context, but users have limited
    visibility into that accumulation.
-   Users may want to continue a conversation in a fresh chat or another
    AI tool without losing essential context.

------------------------------------------------------------------------

## 3. Scope and feature priorities

### MVP --- must ship first

  -----------------------------------------------------------------------
  Priority                Feature                 MVP behavior
  ----------------------- ----------------------- -----------------------
  P0                      Live token counter      Display an estimated
                                                  token count for text in
                                                  the ChatGPT composer.

  P0                      Rule-based prompt       Suggest a shorter
                          compression             version by removing
                                                  safe, clearly redundant
                                                  wording.

  P0                      Before/after comparison Show the original and
                                                  proposed prompt, with
                                                  changes highlighted.

  P0                      Restore / undo          Let users restore
                                                  removed text or revert
                                                  to the original prompt.

  P0                      User confirmation       Apply an optimized
                                                  prompt only after an
                                                  explicit user action.
  -----------------------------------------------------------------------

### Next release

  -----------------------------------------------------------------------
  Priority                Feature                 Expected behavior
  ----------------------- ----------------------- -----------------------
  P1                      Conversation health     Estimate visible
                          monitor                 conversation size and
                                                  show a gentle warning
                                                  as it grows.

  P1                      Semantic loss checks    Flag important details
                                                  that may have been
                                                  removed, including
                                                  numbers, dates, names,
                                                  technologies, limits,
                                                  and explicit
                                                  constraints.

  P1                      Context summarization   Create a reviewable
                                                  summary that can be
                                                  copied into a new
                                                  conversation.

  P1                      Repetition detection    Identify repeated
                                                  information and
                                                  possible redundancy
                                                  across visible
                                                  conversation content.
  -----------------------------------------------------------------------

### Later enhancements

-   Local savings dashboard using `chrome.storage.local`.
-   Compression profiles for coding, research, writing, and general use.
-   Model-aware tokenization and context-limit metadata.
-   Context bookmarks: allow users to mark messages or facts that must
    be retained in summaries.
-   Cross-platform context handoff.
-   Additional supported AI websites, only after the first integration
    is stable.

**Scope rule:** Do not build every feature before launch. Ship the P0
workflow first and validate whether people use it.

------------------------------------------------------------------------

## 4. Proposed technical architecture

### Technology

  Area                   Initial choice
  ---------------------- ------------------------------
  Extension platform     Chrome Extension Manifest V3
  Language               JavaScript
  UI                     HTML + CSS
  Page integration       Content scripts
  Background lifecycle   Extension service worker
  Local persistence      `chrome.storage.local`
  Version control        Git + GitHub
  Initial integration    ChatGPT web app

Keep the first version dependency-light. Introduce a build system or
framework only when it provides a clear benefit.

### Component responsibilities

**Content script** - Detect the supported ChatGPT composer. - Read the
current draft text when the user interacts with ContextIQ. - Observe
relevant DOM changes defensively. - Render or connect the extension UI
without breaking the host page. - Avoid collecting unrelated page data.

**Extension UI** - Display token estimate. - Offer a clear Optimize
action. - Show original and optimized text. - Highlight additions,
removals, and warnings. - Provide Apply, Restore, and Cancel actions.

**Service worker** - Handle extension lifecycle and message routing
where needed. - Do not rely on it as a persistent process; Manifest V3
service workers can be suspended. - Keep state that must survive
suspension in extension storage.

**Storage** - Use `chrome.storage.local` for user-approved settings and
aggregate usage metrics. - Do not persist raw prompts or conversation
text by default. - Provide a way to clear locally stored metrics and
settings.

### Suggested data flow

1.  User types in the ChatGPT composer.
2.  Content script reads the draft text for display/counting.
3.  Token estimator calculates an estimate locally.
4.  User explicitly selects **Optimize**.
5.  Local compression rules produce a candidate.
6.  A comparison view shows all changes.
7.  Preservation checks flag potentially removed constraints.
8.  User chooses Apply, Restore, or Cancel.
9.  Aggregate metrics may be updated locally; raw prompt text is not
    retained.

------------------------------------------------------------------------

## 5. Token-counting accuracy

Tokenization is model-specific. A simple word count or character count
must not be presented as an exact token count.

Implementation requirements: - Identify the tokenizer used for each
supported model where feasible. - If exact model tokenizer support is
unavailable, label the result **Estimated tokens**. - Document which
text is counted: current draft, visible conversation, or another
explicitly defined scope. - Do not claim to know the complete model
context sent by the website. The site may include hidden system
instructions, metadata, tools, attachments, or conversation content that
the extension cannot inspect. - Keep tokenization local in the MVP where
practical. - Test with representative code, prose, multilingual text,
punctuation, and long inputs.

------------------------------------------------------------------------

## 6. Compression and semantic preservation

### Compression strategy

Start with conservative, deterministic rules. Examples: - Remove
repeated whitespace. - Remove duplicated phrases where equivalence is
clear. - Shorten common verbose expressions only when meaning is
preserved. - Remove redundant framing language without changing the
actual request.

Do not aggressively paraphrase technical instructions in the first
release.

### Preservation checks

Before presenting an optimized prompt, compare the original and
candidate for: - Numbers and numeric thresholds. - Dates and
deadlines. - Names and identifiers. - Programming languages, frameworks,
tools, and platforms. - Negations and exclusions (for example, "do not",
"must not", "except"). - Output formats and required structure. -
Explicit constraints, performance targets, and acceptance criteria.

If a critical item appears to be missing or changed: - Flag it
clearly. - Do not claim the optimized prompt is safe. - Prefer
preserving the original text. - Require the user to review before
applying.

**Important:** Semantic loss detection is a risk-reduction feature, not
a mathematical guarantee that meaning is preserved. Communicate
uncertainty honestly.

------------------------------------------------------------------------

## 7. Privacy and security requirements

Privacy is a product feature, not just a policy statement.

For the MVP: - No account required. - No backend required. - No external
transmission of prompt or conversation content. - Request the minimum
Chrome permissions necessary. - Restrict host permissions to the
supported website. - Do not collect browsing history or unrelated page
content. - Do not log raw prompts, tokens derived from sensitive
content, or conversation text. - Store only settings and aggregate
metrics, with clear user controls. - Provide a clear privacy policy that
accurately describes actual behavior. - Treat page content as untrusted
input; never execute content from the page. - Avoid injecting unsafe
HTML. Use safe DOM APIs and text nodes.

Do not advertise "fully local" or "no data collection" unless the
implementation, dependencies, permissions, and telemetry actually
support that claim.

------------------------------------------------------------------------

## 8. Development roadmap

The following is a target sequence, not a promise that every feature
will be completed within the listed time.

### Days 1--2: Foundation

-   Create the GitHub repository.
-   Add a README and project structure.
-   Create the Manifest V3 extension.
-   Add a content script restricted to `chatgpt.com`.
-   Detect the prompt composer robustly.
-   Display a live estimated token count.
-   Test installation through Chrome's developer mode.

**Exit criteria** - Extension loads without manifest errors. - Counter
updates as the draft changes. - No prompt text is sent to an external
service. - Missing or changed composer elements fail gracefully.

### Days 3--5: Prompt optimization

-   Implement conservative rule-based compression.
-   Add an original-versus-optimized comparison.
-   Highlight removed and changed text.
-   Add Apply, Restore, and Cancel actions.
-   Ensure no automatic prompt submission occurs.

**Exit criteria** - User can inspect every proposed change. - User can
restore the original prompt. - Applying an optimized prompt requires
explicit confirmation. - Tests cover code snippets, numbers, negations,
and constraints.

### Days 6--8: Conversation health

-   Determine what conversation content is actually visible and
    accessible.
-   Estimate visible conversation size, clearly labeling its scope.
-   Add configurable, non-intrusive warnings.
-   Test long conversations and dynamic page updates.

**Exit criteria** - Warnings do not block normal ChatGPT use. - The
extension does not claim to measure hidden context. - DOM changes do not
cause repeated observers or memory leaks.

### Days 9--11: Semantic preservation

-   Extract important entities and constraints from the original prompt.
-   Compare them with the optimized candidate.
-   Flag missing or altered requirements.
-   Prefer conservative behavior when uncertain.

**Exit criteria** - Test cases detect removed numbers, dates,
technologies, negations, and output requirements. - A warning is shown
when a required detail may have been lost. - The feature never silently
overrides the user's text.

### Days 12--15: Context summarization

-   Design a structured summary format.
-   Preserve goals, decisions, constraints, open questions, and next
    steps.
-   Let users review and edit the summary.
-   Support copying it into a new chat.

**Exit criteria** - Summary is reviewable before use. - Important facts
and constraints have dedicated sections. - No automatic submission to a
new chat.

### Days 16--18: Polish and metrics

-   Add a simple local savings dashboard.
-   Track aggregate counts such as optimizations applied and estimated
    tokens saved.
-   Add clear definitions for every metric.
-   Fix injection, rendering, and storage issues.
-   Test on different screen sizes and long prompts.

**Exit criteria** - Metrics are labeled as estimates where
appropriate. - No raw prompt content is stored by default. - Users can
clear locally stored data.

### Days 19--21: Release preparation

-   Create icons and store screenshots.
-   Write the privacy policy.
-   Prepare a concise Chrome Web Store description.
-   Test permissions and packaged extension.
-   Submit for review and respond to feedback.

**Exit criteria** - Store listing accurately reflects implemented
functionality. - Privacy disclosures match actual data flows. - A public
GitHub repository and release notes are available.

------------------------------------------------------------------------

## 9. Testing strategy

Create a small regression suite before adding complex features.

### Prompt test cases

-   Short natural-language prompt.
-   Long prompt with repeated wording.
-   Code containing symbols and indentation.
-   Numeric thresholds and performance targets.
-   Dates, names, and identifiers.
-   Negations and exclusions.
-   Multilingual text.
-   Prompt containing secrets or API-key-like strings.
-   Prompt with strict output formatting requirements.

### Browser integration test cases

-   Composer loads after the page.
-   Composer is replaced after navigation.
-   User edits text while the counter is active.
-   User switches conversations.
-   Page rerenders while the extension UI is open.
-   Extension is disabled or reloaded.
-   Very long conversation and very long draft.

### Quality gates

-   No automatic sending.
-   No silent rewriting.
-   No external prompt transmission.
-   No loss of original prompt on errors.
-   Clear fallback when the website DOM changes.
-   No unsupported claims of exact context usage.

------------------------------------------------------------------------

## 10. Success metrics

Track: - Installs and weekly active users. - Number of optimization
previews. - Number of optimizations applied. - Estimated tokens saved. -
Average estimated compression percentage. - Restore/undo rate. - Context
warning interactions. - User-reported usefulness and retention.

Interpret metrics carefully. A high compression rate is not necessarily
good if users frequently restore the original prompt.

------------------------------------------------------------------------

## 11. Release and portfolio goals

The project is successful when it has: - A published Chrome Web Store
listing. - A public GitHub repository with setup instructions. - A clear
architecture diagram and technical README. - A regression test suite. -
A privacy policy consistent with the implementation. - Real usage data
and user feedback. - A short technical case study covering Manifest V3,
DOM integration, tokenization, compression, semantic preservation, and
privacy trade-offs.

Resume bullet should be added only after the product is actually
published and usage numbers are verified. Example:

> Built and published ContextIQ, a privacy-first Chrome extension for AI
> prompt optimization, token estimation, and context management;
> implemented reversible prompt compression, semantic preservation
> checks, and local usage analytics.

Replace any unverified claims or placeholders with actual results.

------------------------------------------------------------------------

## 12. Instructions for the AI coding assistant

Use this document as the source of truth while developing ContextIQ.

### Working mode

1.  Work in small, reviewable milestones.
2.  Before coding, inspect the existing repository and explain the
    proposed file changes.
3.  Do not overwrite existing work without understanding it.
4.  Implement only the current milestone unless asked to expand scope.
5.  After each milestone, run available tests and report the results.
6.  Explain assumptions and unresolved questions rather than inventing
    requirements.
7.  Keep the implementation simple and maintainable.

### Engineering rules

-   Use Manifest V3.
-   Follow Chrome extension security and permission best practices.
-   Keep prompt processing local in the MVP.
-   Do not add a backend, telemetry, analytics SDK, or external AI API
    without explicit approval.
-   Do not silently submit, rewrite, or delete user content.
-   Preserve the original prompt through every optimization flow.
-   Treat token counts as estimates unless exact tokenizer coverage is
    verified.
-   Treat conversation-size measurements as partial if hidden context
    cannot be inspected.
-   Handle DOM changes defensively; do not depend on brittle selectors
    without fallbacks.
-   Avoid broad host permissions.
-   Add tests for compression and preservation logic.
-   Keep user-facing copy transparent about limitations.

### Required response after each coding milestone

Report: - What was implemented. - Files created or modified. - How to
run or load the extension. - Tests performed and their results. - Known
limitations. - The next smallest useful milestone.

### First task

Start with **Days 1--2: Foundation** only.

Inspect the repository (or create a minimal project structure if it is
empty), propose the manifest and content-script files, then implement a
working ChatGPT composer detector and live **estimated** token counter.
Do not implement compression, summarization, dashboards, or backend
services in this first task.

------------------------------------------------------------------------

## 13. Decisions to validate before expanding

-   Which exact tokenizer can be bundled locally for the initial model?
-   Which ChatGPT composer selectors are stable enough, and what
    fallback behavior is needed?
-   What is the safest way to observe visible conversation changes
    without collecting unrelated page content?
-   Which compression transformations are demonstrably
    meaning-preserving?
-   Should semantic loss checks remain rule-based initially, or is a
    local model/library justified later?
-   What user research will validate that context health warnings and
    summaries solve a real problem?

**Guiding rule:** Ship a small, trustworthy tool before building a broad
AI productivity suite.
