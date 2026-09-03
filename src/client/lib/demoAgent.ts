// Judge mode: a scripted, in-page demo that drives the very same registered tools a real agent
// would call — for judges without a WebMCP browser. No LLM. Captions narrate each step.

import type { ToolRegistry } from './webmcp';
import { contextStore } from './context';
import { displayStore } from './display';

export interface DemoRunner {
  stop: () => void;
}

interface Hooks {
  say: (caption: string | null) => void;
  navigate: (path: string) => void;
  done: () => void;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('stopped'));
    });
  });

export function runDemo(reg: ToolRegistry, hooks: Hooks, where: 'home' | 'article'): DemoRunner {
  const ctrl = new AbortController();
  const signal = ctrl.signal;
  const call = async (name: string, input: Record<string, unknown> = {}) => {
    if (signal.aborted) throw new Error('stopped');
    return (await reg.run(name, input, 'demo')) as Record<string, unknown>;
  };
  const step = async (caption: string, ms: number) => {
    hooks.say(caption);
    await sleep(ms, signal);
  };
  const ko = contextStore.get().language === 'ko';
  const t = (en: string, kr: string) => (ko ? kr : en);
  const script = async () => {
    // Clean slate
    await call('forget_me');
    if (where === 'home') {
      await step(t('A judge without an agent? Watch the same tools an agent would call.', '에이전트가 없어도 됩니다. 에이전트가 부를 툴을 그대로 실행합니다.'), 2200);
      await step(t('The agent declares: expert, 3 minutes, already knows compounding.', '에이전트가 선언: 전문가, 3분, 복리는 이미 앎.'), 800);
      await call('declare_reader_context', { level: 'expert', time_minutes: 3, goal: 'decide', knows: ['compounding'], note: t('you asked for the 3-minute decision edition', '3분짜리 결정용 전문가 판을 요청하셨습니다') });
      await sleep(1600, signal);
      await step(t('It opens the article. The page composes a 3-minute expert edition from the author’s blocks.', '기사를 엽니다. 페이지가 저자의 블록으로 3분짜리 전문가 판을 구성합니다.'), 600);
      await call('open_article', { slug: 'compound-interest' });
      await sleep(2800, signal);
    } else {
      await step(t('Watch the tools an agent would call, one by one.', '에이전트가 부를 툴을 하나씩 실행합니다.'), 1800);
      await step(t('Declare: expert, 3 minutes, already knows compounding. The page recomposes.', '선언: 전문가, 3분, 복리는 이미 앎. 페이지가 다시 구성됩니다.'), 600);
      await call('declare_reader_context', { level: 'expert', time_minutes: 3, goal: 'decide', knows: ['compounding'], note: t('you asked for the 3-minute decision edition', '3분짜리 결정용 전문가 판을 요청하셨습니다') });
      await sleep(2800, signal);
    }
    const ed = (await call('get_edition')) as { edition: { minutes: number; full_minutes: number }; outline: { section_id: string; blocks: number }[] };
    await step(t(`Edition: ${ed.edition.minutes} of ${ed.edition.full_minutes} minutes. Every left-out block has a reason.`, `판: 전체 ${ed.edition.full_minutes}분 중 ${ed.edition.minutes}분. 빠진 블록마다 이유가 있습니다.`), 2800);

    await step(t('Now the person, not the topic: low vision, reading in a dark room. The agent already knows.', '이번엔 사람: 저시력, 어두운 방. 에이전트는 이미 압니다.'), 700);
    await call('declare_reader_needs', { vision: 'low-vision', light: 'dark-room', note: t('set from what you told me earlier', '전에 말씀하신 내용으로 설정') });
    await step(t('Dark, extra-large hyperlegible type, big controls. The page chose; the panel says why.', '다크, 아주 큰 하이퍼레지블 글꼴, 큰 버튼. 페이지가 골랐고 패널이 이유를 말합니다.'), 4200);
    await call('declare_reader_needs', { vision: 'typical', light: 'normal' });
    await call('set_display', { preset: 'default' });
    await sleep(900, signal);

    await step(t('The calculator is a tool too: 500 a month, 40 years, 1% fee.', '계산기도 툴입니다: 매달 500, 40년, 수수료 1%.'), 600);
    const si = (await call('set_interactive', { id: 'compound-calculator', params: { monthly: 500, years: 40, fee: 1 } })) as { ok?: boolean; result?: { final_value?: number; fee_cost?: number } };
    if (si.ok) {
      const el = document.querySelector('.interactive-wrap');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await step(t(`Final value ${si.result?.final_value?.toLocaleString()} — ${si.result?.fee_cost?.toLocaleString()} lost to the fee. The agent gets the same numbers you see.`, `최종 ${si.result?.final_value?.toLocaleString()}, 수수료로 ${si.result?.fee_cost?.toLocaleString()} 손실. 에이전트도 같은 숫자를 받습니다.`), 4200);
    }

    await step(t('Ask the author: only the author’s written answers, never a guess.', '저자에게 묻기: 저자가 쓴 답만, 추측은 없음.'), 600);
    const aa = (await call('ask_author', { question: 'Does inflation matter here?' })) as { covered?: boolean };
    await step(aa.covered ? t('Covered — in the author’s words.', '저자의 말로 답했습니다.') : t('Not covered — the page says so instead of guessing.', '안 다룸 — 추측 대신 그렇다고 말합니다.'), 2600);

    await step(t('Where did the reader get stuck? Swap in the author’s plainer version.', '어디서 막혔나? 저자의 쉬운 버전으로 교체.'), 600);
    const sec = (await call('read_section', {})) as { blocks: { block_id: string; kind: string }[] };
    let target: string | null = null;
    for (const b of sec.blocks.filter((x) => x.kind === 'para')) {
      const rb = (await call('read_block', { block_id: b.block_id })) as { has_simpler_version?: boolean };
      if (rb.has_simpler_version) {
        target = b.block_id;
        break;
      }
    }
    if (target) {
      document.getElementById(`b-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(900, signal);
      await call('simplify_block', { block_id: target });
      await step(t('Same idea, the author’s plainer words, highlighted in place.', '같은 내용, 저자의 쉬운 말, 그 자리에서 강조.'), 3200);
    }

    await step(t('“Forget me.” Everything the page knew is gone.', '“잊어줘.” 페이지가 알던 것이 전부 지워집니다.'), 700);
    await call('forget_me');
    await step(t('That is Attune: words and screen composed for you, from the author’s own blocks, through WebMCP.', '이것이 Attune입니다. 글과 화면을 당신에게 맞춰, 저자의 블록으로, WebMCP로.'), 3600);
    hooks.say(null);
  };
  script()
    .catch(() => hooks.say(null))
    .finally(() => {
      void displayStore;
      hooks.done();
    });
  return { stop: () => ctrl.abort() };
}
