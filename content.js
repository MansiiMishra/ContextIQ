(() => {
  'use strict';
  if (window.__contextIQLoaded) return;
  window.__contextIQLoaded = true;

  const host = document.createElement('div');
  host.id = 'contextiq-root';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;right:18px;bottom:18px';
  document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}button,textarea{font:inherit}button{cursor:pointer}
    .launch{border:0;border-radius:999px;padding:11px 16px;background:#16243a;color:#fff;font:600 13px system-ui;box-shadow:0 5px 22px #0004}
    .panel{display:none;width:330px;max-height:min(78vh,650px);overflow:auto;border:1px solid #d7deea;border-radius:16px;background:#fff;color:#172033;font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 12px 42px #0003}
    .panel.open{display:block}.head{padding:14px 16px;background:#16243a;color:white;display:flex;align-items:center;justify-content:space-between;border-radius:15px 15px 0 0}
    .head strong{font-size:15px}.sub{opacity:.76;font-size:11px}.icon{background:transparent;color:inherit;border:0;font-size:18px}
    .body{padding:12px}.draft-card{padding:12px;border-radius:11px;background:#f2f5fa;display:flex;align-items:center;justify-content:space-between}.draft-count{font-size:21px;font-weight:700}.draft-label{display:block;color:#637086;font-size:11px}.approx{color:#68758a;font-size:10px}.suggestion{margin-top:10px;padding:10px;border:1px solid #e2e7ef;border-radius:10px}.suggestion-text{margin:0 0 8px;color:#42516a;font-size:12px}.warning{background:#fff4df;color:#795300}.section{margin-top:14px}.section h3{margin:0 0 7px;font-size:13px}.actions{display:flex;gap:7px;flex-wrap:wrap}.btn{border:1px solid #ccd5e2;background:#fff;border-radius:8px;padding:7px 10px;color:#172033;font-size:12px}.btn.primary{background:#2463eb;border-color:#2463eb;color:#fff}.btn:disabled{opacity:.45;cursor:not-allowed}
    .field{width:100%;min-height:90px;resize:vertical;border:1px solid #ccd5e2;border-radius:9px;padding:9px;color:#172033;background:#fff;font:12px/1.45 ui-monospace,monospace}
    .diff{white-space:pre-wrap;overflow-wrap:anywhere;padding:9px;background:#f7f9fc;border:1px solid #e2e7ef;border-radius:9px;max-height:145px;overflow:auto;font:12px/1.5 ui-monospace,monospace}.removed{background:#ffe0e0;text-decoration:line-through}.added{background:#d9f8df}.list{margin:8px 0 0;padding-left:18px;color:#755100}.muted{color:#68758a;font-size:11px}.hidden{display:none!important}.divider{height:1px;background:#e8ecf2;margin:13px 0}.tools{margin-top:14px;border-top:1px solid #e8ecf2;padding-top:10px}.tools summary{cursor:pointer;font-weight:650;list-style:none}.tools summary::-webkit-details-marker{display:none}.tools summary:after{content:'+';float:right;color:#68758a}.tools[open] summary:after{content:'−'}.tools-body{padding-top:8px}.health-text{margin:5px 0}.message-list{display:grid;gap:5px;margin-top:7px}.message-row{display:grid;grid-template-columns:58px 1fr auto;gap:5px;align-items:start;padding:6px 8px;border-radius:8px;background:#f7f9fc;font-size:10px}.message-role{font-weight:600;color:#41516a}.message-preview{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#68758a}.message-tokens{white-space:nowrap;color:#34445c;font-weight:600}.tools summary+div{font-size:11px}
  `;
  shadow.append(style);
  const shell = document.createElement('div');
  shell.innerHTML = `<button class="launch" aria-label="Open ContextIQ">ContextIQ</button><section class="panel" aria-label="ContextIQ assistant"><header class="head"><div><strong>ContextIQ</strong><div class="sub">Your draft, clearer and shorter</div></div><button class="icon close" aria-label="Close">×</button></header><div class="body">
    <div class="draft-card"><div><b class="draft-count">0</b><span class="draft-label">Estimated draft tokens</span></div><span class="approx">Approximate</span></div>
    <div class="suggestion"><p class="suggestion-text">Type in the composer. I’ll check for safe edits automatically.</p><button class="btn primary review-trigger hidden">Review changes</button></div>
    <div class="review hidden"><p class="muted savings-line"></p><div class="diff"></div><ul class="list warnings hidden"></ul><div class="actions review-actions"><button class="btn primary apply hidden">Apply to draft</button><button class="btn cancel">Close review</button></div></div>
    <button class="btn restore hidden">Restore original draft</button>
    <details class="tools"><summary>Conversation tools</summary><div class="tools-body"><div class="muted conversation-line">Visible conversation estimate: 0 tokens.</div><div class="muted health-text">Checking visible messages…</div><label class="muted">Warn after <select class="threshold" aria-label="Conversation warning threshold"><option value="8">8 messages</option><option value="12" selected>12 messages</option><option value="20">20 messages</option><option value="0">Never</option></select></label><div class="muted repetition-text"></div><div class="muted message-caption">Estimated tokens per visible message</div><div class="message-list"></div><div class="summary-section"><h3>Summary</h3><button class="btn summarize">Create editable summary</button><p class="muted summary-status hidden"></p><textarea class="field summary hidden" aria-label="Editable conversation summary"></textarea><div class="actions summary-actions hidden"><button class="btn primary copy">Copy summary</button></div></div></div></details>
    <p class="muted footer-note">Local analysis · Nothing is changed or sent without your action.</p>
  </div></section>`;
  shadow.append(shell);
  const $ = (s) => shadow.querySelector(s);
  const panel = $('.panel');
  $('.launch').addEventListener('click', () => { panel.classList.toggle('open'); refresh(); analyzeDraft(); });
  $('.close').addEventListener('click', () => panel.classList.remove('open'));

  const composerSelectors = [
    '#prompt-textarea', 'textarea[data-testid="prompt-textarea"]',
    '[contenteditable="true"][data-testid="prompt-textarea"]',
    'form [contenteditable="true"][role="textbox"]',
    'textarea[placeholder]'
  ];
  function findComposer() {
    for (const selector of composerSelectors) {
      const nodes = [...document.querySelectorAll(selector)];
      const found = nodes.find((el) => el.isConnected && !host.contains(el) && el.getClientRects().length && !el.closest('[aria-hidden="true"]'));
      if (found) return found;
    }
    return null;
  }
  function read(el) { return el ? (el.isContentEditable ? el.innerText : el.value || '') : ''; }
  function write(el, value) {
    if (!el) return false;
    el.focus();
    if (el.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
      if (!document.execCommand('insertText', false, value)) el.textContent = value;
    } else {
      const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  const Core = globalThis.ContextIQCore;
  const { estimate, optimize, preservationWarnings, diffHtml } = Core;
  function visibleEntries() { return Core.collectVisibleMessageEntries(document, host); }
  function visibleMessages() { return visibleEntries().map(entry => entry.text); }
  function currentText() { return read(findComposer()); }
  function showDiff(before, after) { $('.diff').innerHTML = diffHtml(before, after); }
  let snapshot = '', candidate = '';
  let appliedOriginal = '', appliedValue = '';
  let reviewOpen = false;
  let analysisTimer = null;
  let programmaticChange = false;
  let warningThreshold = 12;
  $('.threshold').addEventListener('change', (event) => { warningThreshold = Number(event.target.value); refresh(); });

  function renderReview() {
    if (!reviewOpen) return;
    showDiff(snapshot, candidate);
    const savings = Math.max(0, estimate(snapshot) - estimate(candidate));
    $('.savings-line').textContent = candidate === snapshot
      ? 'No safe wording changes found.'
      : savings > 0 ? `Estimated ${savings} tokens shorter.` : 'Wording cleanup found; token estimate is unchanged.';
    const warnings = preservationWarnings(snapshot, candidate);
    const list = $('.warnings'); list.replaceChildren();
    if (warnings.length) { warnings.forEach(w => { const li = document.createElement('li'); li.textContent = w; list.append(li); }); list.classList.remove('hidden'); }
    else list.classList.add('hidden');
    $('.review').classList.remove('hidden');
    $('.apply').classList.toggle('hidden', candidate === snapshot);
  }

  function analyzeDraft() {
    const text = currentText();
    $('.draft-count').textContent = estimate(text).toLocaleString();
    snapshot = text;
    candidate = text.trim() ? optimize(text) : '';
    const changed = Boolean(candidate && candidate !== snapshot);
    const savings = Math.max(0, estimate(snapshot) - estimate(candidate));
    $('.suggestion-text').textContent = !text.trim()
      ? 'Type in the composer. I’ll check for safe edits automatically.'
      : changed
        ? savings > 0 ? `Potential cleanup found · about ${savings} tokens shorter.` : 'Potential wording cleanup found.'
        : 'No safe wording changes found.';
    $('.review-trigger').classList.toggle('hidden', !changed);
    if (appliedOriginal && text !== appliedValue) { appliedOriginal = ''; appliedValue = ''; }
    $('.restore').classList.toggle('hidden', !appliedOriginal);
    if (reviewOpen) renderReview();
  }
  function scheduleAnalysis() {
    clearTimeout(analysisTimer);
    analysisTimer = setTimeout(analyzeDraft, 350);
  }

  $('.review-trigger').addEventListener('click', () => { reviewOpen = true; renderReview(); });
  $('.apply').addEventListener('click', () => {
    const composer = findComposer();
    if (!composer || !candidate || candidate === snapshot) return;
    appliedOriginal = snapshot; appliedValue = candidate;
    programmaticChange = true;
    write(composer, candidate);
    programmaticChange = false;
    reviewOpen = false; $('.review').classList.add('hidden');
    $('.review-trigger').classList.add('hidden');
    $('.restore').classList.remove('hidden');
    $('.suggestion-text').textContent = 'Optimized draft applied. It has not been submitted.';
    refresh();
  });
  $('.restore').addEventListener('click', () => {
    const composer = findComposer();
    if (!composer || !appliedOriginal) return;
    const original = appliedOriginal;
    programmaticChange = true; write(composer, original); programmaticChange = false;
    appliedOriginal = ''; appliedValue = ''; reviewOpen = false;
    $('.restore').classList.add('hidden'); $('.review').classList.add('hidden');
    analyzeDraft(); refresh();
  });
  $('.cancel').addEventListener('click', () => { reviewOpen = false; $('.review').classList.add('hidden'); });

  function repeatedInformation(messages) {
    const counts = new Map();
    for (const message of messages) {
      const clean = message.replace(/\s+/g, ' ').trim();
      if (clean.length >= 35) counts.set(clean, (counts.get(clean) || 0) + 1);
    }
    const repeated = [...counts].filter(([, count]) => count > 1).length;
    return repeated ? `${repeated} exact repeated message${repeated === 1 ? '' : 's'} found in visible content.` : 'No exact repeated messages detected.';
  }
  function summarize(entries) {
    const userMessages = entries.filter(entry => /user/i.test(entry.role)).map(entry => entry.text);
    const assistantMessages = entries.filter(entry => /assistant/i.test(entry.role)).map(entry => entry.text);
    const allMessages = entries.map(entry => entry.text);
    const source = userMessages.length ? userMessages : allMessages;
    const take = (list, max) => list.slice(-max).map(x => x.replace(/\s+/g, ' ').slice(0, 500));
    const goals = take(source.filter(x => /\b(want|need|goal|build|create|help|please|task|objective)\b/i.test(x)), 5);
    const constraints = take(source.filter(x => /\b(must|should|don't|do not|never|only|exactly|limit|without|except|format|deadline)\b/i.test(x)), 5);
    const decisions = take(assistantMessages.filter(x => /\b(decided|will use|chosen|recommend|agreed|implemented)\b/i.test(x)), 4);
    const recent = take(source.slice(-4), 4);
    return [`GOALS\n${(goals.length ? goals : recent).map(x => `- ${x}`).join('\n') || '- Review the visible conversation and add the main goal.'}`, `CONSTRAINTS\n${constraints.map(x => `- ${x}`).join('\n') || '- Review visible messages for constraints.'}`, `DECISIONS\n${decisions.map(x => `- ${x}`).join('\n') || '- No explicit decisions detected; review the conversation.'}`, `OPEN QUESTIONS / NEXT STEPS\n- Review this draft, correct omissions, then paste it into a new conversation if useful.`].join('\n\n');
  }
  $('.summarize').addEventListener('click', () => {
    const entries = visibleEntries();
    if (!entries.length) {
      $('.summary-status').textContent = 'No visible messages detected. Refresh ChatGPT and try again.';
      $('.summary-status').classList.remove('hidden');
      return;
    }
    $('.summary-status').classList.add('hidden'); $('.summary').value = summarize(entries); $('.summary').classList.remove('hidden'); $('.summary-actions').classList.remove('hidden');
  });
  $('.copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('.summary').value); $('.copy').textContent = 'Copied'; setTimeout(() => $('.copy').textContent = 'Copy summary', 1500); }
    catch { $('.summary').focus(); $('.summary').select(); document.execCommand('copy'); }
  });
  function refresh() {
    const draft = currentText(), entries = visibleEntries(), messages = entries.map(entry => entry.text);
    $('.draft-count').textContent = estimate(draft).toLocaleString();
    const conversationText = messages.join('\n');
    $('.conversation-line').textContent = `Visible conversation estimate: ~${estimate(conversationText).toLocaleString()} tokens.`;
    const count = messages.length;
    const warn = warningThreshold > 0 && count >= warningThreshold;
    $('.health-text').textContent = count === 0
      ? 'No visible messages detected. This ChatGPT layout may need an updated detector.'
      : warn
        ? `${count} visible messages; approximately ${estimate(conversationText).toLocaleString()} tokens. Consider reviewing or summarizing this conversation.`
        : `${count} visible messages. No growth warning.`;
    $('.health-text').classList.toggle('warning', warn);
    $('.repetition-text').textContent = repeatedInformation(messages);
    const messageList = $('.message-list');
    messageList.replaceChildren();
    for (const [index, entry] of entries.slice(-10).entries()) {
      const row = document.createElement('div'); row.className = 'message-row';
      const role = document.createElement('span'); role.className = 'message-role';
      role.textContent = /user/i.test(entry.role) ? 'You' : /assistant/i.test(entry.role) ? 'Assistant' : `Message ${Math.max(1, entries.length - 9 + index)}`;
      const preview = document.createElement('span'); preview.className = 'message-preview'; preview.textContent = entry.text.replace(/\s+/g, ' ');
      const tokens = document.createElement('span'); tokens.className = 'message-tokens'; tokens.textContent = `~${estimate(entry.text).toLocaleString()} tokens`;
      row.append(role, preview, tokens); messageList.append(row);
    }
  }
  let composing = null;
  document.addEventListener('input', (event) => {
    if (event.target === findComposer()) {
      if (!programmaticChange) scheduleAnalysis();
      refresh();
    }
  }, true);
  const observer = new MutationObserver(() => {
    const next = findComposer();
    if (next !== composing) { composing = next; refresh(); scheduleAnalysis(); }
    if (panel.classList.contains('open')) refresh();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(() => { if (panel.classList.contains('open')) refresh(); }, 1800);
  refresh();
  analyzeDraft();
})();
