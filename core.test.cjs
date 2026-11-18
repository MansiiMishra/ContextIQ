const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('./core.js');

test('estimate treats blank and whitespace-only drafts as zero', () => {
  assert.equal(Core.estimate(''), 0);
  assert.equal(Core.estimate(' \n\t '), 0);
  assert.equal(Core.estimate('12345678'), 2);
});

test('optimization keeps protected numbers and negation in the candidate', () => {
  const original = 'Please note that I would like you to keep exactly 3 items and do not remove API support.';
  const candidate = Core.optimize(original);
  assert.match(candidate, /3/);
  assert.match(candidate, /do not/i);
  assert.match(candidate, /API/);
  assert.ok(Core.estimate(candidate) < Core.estimate(original));
});

test('diff groups changes around unchanged words and escapes text', () => {
  const html = Core.diffHtml('Please note that summarize this report.', 'Please summarize this report.');
  assert.match(html, /^Please /);
  assert.match(html, /class="removed">note that/);
  assert.match(html, /<\/span>summarize this report\.$/);
  assert.equal(Core.diffHtml('<old>', '<new>'), '<span class="removed">&lt;old&gt;</span><span class="added">&lt;new&gt;</span>');
});

test('message collection falls back to visible conversation turn markers', () => {
  const makeNode = (text, visible = true, inHost = false) => ({
    innerText: text,
    getClientRects: () => visible ? [{}] : [],
    getAttribute: (name) => name === 'data-message-author-role' ? 'user' : null,
    closest: () => null,
    inHost
  });
  const first = makeNode('User message: summarize the report');
  const duplicate = makeNode('User message: summarize the report');
  const hidden = makeNode('Hidden old message', false);
  const hostNode = makeNode('ContextIQ panel text', true, true);
  const doc = {
    querySelectorAll(selector) {
      if (selector.includes('data-testid*="conversation-turn"')) return [first, duplicate, hidden, hostNode];
      return [];
    },
    defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
  };
  const ignoredRoot = { contains: (node) => node.inHost };
  assert.deepEqual(Core.collectVisibleMessages(doc, ignoredRoot), ['User message: summarize the report']);
  assert.equal(Core.collectVisibleMessageEntries(doc, ignoredRoot)[0].role, 'user');
});

test('message collection supports accessible ChatGPT turn headings', () => {
  const isHeadingSelector = (selector) => selector.includes('h1') && selector.includes('role="heading"');
  const makeNode = (text, role = null) => ({
    innerText: text,
    parentElement: null,
    children: [],
    getClientRects: () => [{}],
    getAttribute: (name) => name === 'role' && role ? 'heading' : null,
    querySelectorAll(selector) {
      if (!isHeadingSelector(selector)) return [];
      return this.children.flatMap(child => [child, ...child.querySelectorAll(selector)]).filter(child => child.getAttribute('role') === 'heading');
    }
  });
  const userHeading = makeNode('You said:', 'speaker');
  const assistantHeading = makeNode('ChatGPT said:', 'speaker');
  const userTurn = makeNode('You said:\nSummarize this plan.');
  const assistantTurn = makeNode('ChatGPT said:\nI will summarize the plan.');
  userHeading.parentElement = userTurn; assistantHeading.parentElement = assistantTurn;
  userTurn.children = [userHeading]; assistantTurn.children = [assistantHeading];
  const main = makeNode(`${userTurn.innerText}\n${assistantTurn.innerText}`);
  main.children = [userTurn, assistantTurn];
  userTurn.parentElement = main; assistantTurn.parentElement = main;
  const doc = {
    querySelectorAll: () => [],
    querySelector: (selector) => selector === 'main' ? main : null,
    defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
  };
  const entries = Core.collectVisibleMessageEntries(doc, { contains: () => false });
  assert.equal(entries.length, 2);
  assert.equal(entries[0].role, 'user');
  assert.equal(entries[1].role, 'assistant');
});
