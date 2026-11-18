# ContextIQ

ContextIQ is a privacy-first Chrome extension prototype for ChatGPT. It estimates draft size, offers conservative prompt cleanup with a reviewable diff, and summarizes only conversation messages visible in the page.

## Features

- Live **estimated** token count for the composer, using a transparent character-based heuristic (~4 characters per token), not a model tokenizer.
- Automatic local detection of safe wording and whitespace cleanup opportunities. The candidate is never applied automatically.
- Before/after highlighting, preservation warnings, explicit Apply, Restore original, and Cancel controls.
- Visible conversation size estimate and a configurable gentle warning threshold (8, 12, 20 messages, or off).
- Per-message **estimated token counts** for the latest visible messages; these are message-size estimates, not tokens saved.
- Exact repeated-message detection and an editable, locally generated conversation summary.
- No backend, external requests, analytics, or prompt storage. No Chrome API permissions are requested.

## Run the local logic checks

With Node.js installed, run `node --test core.test.cjs`. These checks cover blank estimates, conservative optimization, readable and escaped diffs, and visible-message detection fallbacks.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this folder.
4. Open or refresh `https://chatgpt.com/`. The ContextIQ button appears in the lower-right corner.

After editing extension files, select **Reload** on the extension card and refresh the ChatGPT tab.

## Use

Open ContextIQ and type in the composer. ContextIQ analyzes the draft locally and automatically shows **Review changes** when it finds a safe cleanup. Review the diff and warnings, then choose **Apply to draft**; it never submits the prompt. **Restore original draft** returns the pre-optimization text. Conversation tools are collapsed by default to keep the panel focused. Conversation summaries are drafts: edit them before copying or using them elsewhere.

## Scope and limitations

- The token counter is a rough estimate, not exact tokenizer output.
- Conversation size covers visible message text only. Hidden system instructions, tools, attachments, and other inaccessible context are excluded.
- Preservation checks use simple pattern matching and cannot guarantee equivalent meaning. Review the original and candidate carefully.
- Summary generation uses local rules and visible DOM text. It can miss facts, decisions, and open questions; edit it before relying on it.
- ChatGPT can change its page structure. If the composer cannot be found, reload the page or update the selector list in `content.js`.
- The extension is scoped to `https://chatgpt.com/*` and is not yet published in the Chrome Web Store.

## Privacy

See [PRIVACY.md](PRIVACY.md). Prompt and conversation text are processed in the current browser tab only. ContextIQ has no network code and does not persist content.
