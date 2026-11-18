(() => {
  'use strict';

  const safeRules = [
    [/[ \t]+\n/g, '\n'],
    [/\n{3,}/g, '\n\n'],
    [/^[ \t]+|[ \t]+$/gm, ''],
    [/\bPlease note that\s+/gi, ''],
    [/\bIt is important to note that\s+/gi, ''],
    [/\bI would like you to\s+/gi, 'Please '],
    [/\bCould you please\s+/gi, 'Please '],
    [/\bIn order to\b/gi, 'To'],
    [/\bfor the purpose of\b/gi, 'for'],
    [/\bAt this point in time\b/gi, 'Now']
  ];

  function estimate(text) {
    if (!text || !text.trim()) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  function optimize(text) {
    let result = text;
    for (const [pattern, replacement] of safeRules) result = result.replace(pattern, replacement);
    return result.trim();
  }

  function preservationWarnings(original, candidate) {
    const warnings = [];
    const checks = [
      ['numbers or thresholds', /\b\d+(?:\.\d+)?(?:%|\b)/g],
      ['dates or times', /\b(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}-\d{2}-\d{2}|today|tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi],
      ['quoted terms or identifiers', /"[^"\n]{1,80}"|`[^`\n]{1,80}`/g],
      ['negations or exclusions', /\b(?:not|never|without|except|unless|mustn't|shouldn't|don't|do not|must not|only)\b/gi],
      ['technical names', /\b(?:JavaScript|TypeScript|Python|React|Chrome|Manifest V3|API|SQL|Node\.js|ChatGPT|performance|latency|memory)\b/gi],
      ['output constraints', /\b(?:JSON|CSV|Markdown|table|bullet points|exactly|at least|no more than|format|schema)\b/gi]
    ];
    for (const [label, re] of checks) {
      const before = original.match(re) || [];
      const after = candidate.match(re) || [];
      if (before.length > after.length || before.some((item) => !candidate.toLowerCase().includes(item.toLowerCase()))) warnings.push(`Review ${label}: a detail may have changed.`);
    }
    return warnings;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function diffHtml(before, after) {
    const b = before.match(/\s+|[^\s]+/g) || [];
    const a = after.match(/\s+|[^\s]+/g) || [];
    if (before === after) return 'No changes.';
    let ops = [];
    if (b.length * a.length > 2_250_000) {
      let prefix = 0;
      while (prefix < b.length && prefix < a.length && b[prefix] === a[prefix]) prefix++;
      let suffix = 0;
      while (suffix < b.length - prefix && suffix < a.length - prefix && b[b.length - 1 - suffix] === a[a.length - 1 - suffix]) suffix++;
      ops = b.slice(0, prefix).map(value => ['same', value]);
      ops.push(...b.slice(prefix, b.length - suffix).map(value => ['removed', value]));
      ops.push(...a.slice(prefix, a.length - suffix).map(value => ['added', value]));
      ops.push(...b.slice(b.length - suffix).map(value => ['same', value]));
    } else {
      const width = a.length + 1;
      const table = new Uint16Array((b.length + 1) * width);
      for (let i = b.length - 1; i >= 0; i--) {
        for (let j = a.length - 1; j >= 0; j--) {
          table[i * width + j] = b[i] === a[j]
            ? table[(i + 1) * width + j + 1] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
        }
      }
      let i = 0, j = 0;
      while (i < b.length || j < a.length) {
        if (i < b.length && j < a.length && b[i] === a[j]) { ops.push(['same', b[i]]); i++; j++; }
        else if (i < b.length && (j >= a.length || table[(i + 1) * width + j] >= table[i * width + j + 1])) { ops.push(['removed', b[i++]]); }
        else { ops.push(['added', a[j++]]); }
      }
    }
    let html = '';
    for (let i = 0; i < ops.length;) {
      const type = ops[i][0];
      let text = '';
      while (i < ops.length && ops[i][0] === type) text += ops[i++][1];
      const escaped = escapeHtml(text);
      html += type === 'same' ? escaped : `<span class="${type}">${escaped}</span>`;
    }
    return html;
  }

  function collectVisibleMessageEntries(doc, ignoredRoot) {
    const selectors = [
      'main [data-message-author-role="user"], main [data-message-author-role="assistant"]',
      'main [data-testid*="conversation-turn"], main [data-testid*="turn"]',
      'main [data-message-id], main [data-turn]',
      'main article',
      'main [role="article"]',
      'main [class*="group/turn"]'
    ];
    for (const selector of selectors) {
      const nodes = [...doc.querySelectorAll(selector)].filter((el) => {
        if (!el.getClientRects().length || ignoredRoot?.contains(el)) return false;
        const style = doc.defaultView?.getComputedStyle(el);
        return (!style || (style.display !== 'none' && style.visibility !== 'hidden'));
      });
      const messages = [];
      const seen = new Set();
      for (const el of nodes) {
        const text = (el.innerText || '').trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          const roleNode = el.closest?.('[data-message-author-role]') || el.querySelector?.('[data-message-author-role]') || el;
          const role = roleNode.getAttribute?.('data-message-author-role') || roleNode.getAttribute?.('data-turn') || 'Message';
          messages.push({ element: el, text, role });
        }
      }
      if (messages.length) return messages;
    }

    // Recent ChatGPT layouts expose each turn as a heading ("You said:" /
    // "ChatGPT said:") without the older message-role/test-id attributes.
    const main = doc.querySelector('main');
    if (main) {
      const isSpeakerHeading = (el) => /^(?:you said|chatgpt said):?$/i.test((el.innerText || '').trim());
      const headings = [...main.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].filter(isSpeakerHeading);
      const entries = [];
      const seen = new Set();
      for (const heading of headings) {
        let parent = heading.parentElement;
        let container = null;
        while (parent && parent !== main) {
          const nested = [...parent.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].filter(isSpeakerHeading);
          if (nested.length > 1) break;
          const text = (parent.innerText || '').trim();
          if (text.length > (heading.innerText || '').trim().length) container = parent;
          parent = parent.parentElement;
        }
        let text = '';
        if (container?.cloneNode) {
          const clone = container.cloneNode(true);
          clone.querySelectorAll('button,[role="button"],svg,[aria-hidden="true"]').forEach(node => node.remove());
          clone.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]').forEach(node => { if (isSpeakerHeading(node)) node.remove(); });
          text = (clone.innerText || clone.textContent || '').trim();
        } else {
          text = (container?.innerText || '').replace((heading.innerText || '').trim(), '').trim();
        }
        if (!container || !text || ignoredRoot?.contains(container) || !container.getClientRects().length || seen.has(text)) continue;
        seen.add(text);
        const headingText = (heading.innerText || '').trim().toLowerCase();
        entries.push({ element: container, text, role: headingText.startsWith('you') ? 'user' : 'assistant' });
      }
      if (entries.length) return entries;
    }
    return [];
  }

  function collectVisibleMessages(doc, ignoredRoot) {
    return collectVisibleMessageEntries(doc, ignoredRoot).map(entry => entry.text);
  }

  const api = { estimate, optimize, preservationWarnings, diffHtml, collectVisibleMessages, collectVisibleMessageEntries };
  globalThis.ContextIQCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
