import { createElement, Fragment, type ReactNode } from 'react';

// Markdown-lite: **bold**, `code`, [text](url), and newlines. No HTML is ever interpreted.
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(createElement('strong', { key: k++ }, tok.slice(2, -2)));
    else if (tok.startsWith('*')) out.push(createElement('em', { key: k++ }, tok.slice(1, -1)));
    else if (tok.startsWith('`')) out.push(createElement('code', { key: k++ }, tok.slice(1, -1)));
    else {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const href = /^https?:\/\//.test(mm[2]) ? mm[2] : '#';
      out.push(createElement('a', { key: k++, href, target: '_blank', rel: 'noreferrer' }, mm[1]));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderParagraphs(text: string): ReactNode[] {
  return text.split(/\n{2,}|\n/).map((line, i) => createElement(Fragment, { key: i }, i > 0 ? createElement('br') : null, ...renderInline(line)));
}

export function renderList(text: string): ReactNode[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean)
    .map((l, i) => createElement('li', { key: i }, ...renderInline(l)));
}
