# ContextIQ privacy notice

**Last updated: November 11, 2026**

ContextIQ is a local Chrome extension prototype for `chatgpt.com`.

## Data processed

When its content script runs, ContextIQ reads the current ChatGPT composer draft to estimate its size and, after a short pause while you type, generate a possible cleanup candidate locally. The candidate is shown for review only when a safe wording change is found. ContextIQ reads visible conversation messages when displaying conversation estimates, per-message size estimates, repetition information, or a requested summary.

## Data sharing and storage

ContextIQ does not transmit prompt or conversation content to a server, use analytics or telemetry, or save prompt and conversation content. It does not require an account or request Chrome API permissions. The editable summary remains in the current page until you close or reload it. If you choose Copy summary, the browser clipboard receives the text as requested.

## Controls and limitations

You control whether a candidate is applied to the draft. Applying does not submit it. Estimates and rule-based checks are approximate; hidden ChatGPT context is not measured. The extension is provided as a prototype and its behavior should be reviewed before use with sensitive information.

## Contact

This prototype does not yet have a support or privacy-contact address. Add a maintained contact channel before distributing it publicly.
