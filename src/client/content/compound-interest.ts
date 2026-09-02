import type { Article } from '../../shared/content';

// Attune article #2 — "Compound interest: why time beats rate".
// All figures use monthly compounding with end-of-month contributions unless the text says "compounded yearly".
// Illustrative mathematics only; nothing here is investment advice.

export const article: Article = {
  slug: 'compound-interest',
  title: { en: 'Compound interest: why time beats rate', ko: '복리: 왜 수익률보다 시간이 이기는가' },
  deck: {
    en: 'Growth that keeps its own gains is the quietest force in personal finance. Here is how it works, why starting early beats chasing returns, and what compounds against you.',
    ko: '자기 수익을 계속 품고 자라는 성장은 개인 금융에서 가장 조용한 힘입니다. 복리가 어떻게 작동하는지, 왜 일찍 시작하는 것이 높은 수익률을 좇는 것보다 나은지, 그리고 무엇이 당신에게 불리하게 복리로 쌓이는지 설명합니다.',
  },
  author: 'Attune editors',
  date: '2026-09-02',
  interactives: {
    'compound-calculator': {
      title: { en: 'Compound growth calculator', ko: '복리 성장 계산기' },
      description: {
        en: 'Future value of a starting amount plus monthly contributions, compounded monthly, with an optional annual fee subtracted from the return. Change any parameter and the chart and totals update.',
        ko: '시작 금액과 월 납입액의 미래 가치를 월복리로 계산합니다. 연간 수수료를 수익률에서 빼는 옵션이 있습니다. 어떤 값이든 바꾸면 차트와 합계가 갱신됩니다.',
      },
      params: {
        principal: { type: 'number', description: 'Starting amount', min: 0, max: 10000000, default: 10000 },
        monthly: { type: 'number', description: 'Contribution added at the end of each month', min: 0, max: 100000, default: 200 },
        rate: { type: 'number', description: 'Annual return in percent', min: 0, max: 30, default: 7 },
        years: { type: 'number', description: 'Years invested', min: 1, max: 60, default: 30 },
        fee: { type: 'number', description: 'Annual fee in percent, subtracted from the return', min: 0, max: 5, default: 0 },
      },
    },
  },
  concepts: [
    { id: 'principal', label: { en: 'principal', ko: '원금' }, definition: { en: 'The money you start with, or add later, before any growth.', ko: '성장이 붙기 전에 처음 넣은 돈, 또는 나중에 추가로 넣은 돈.' } },
    { id: 'interest-rate', label: { en: 'interest rate', ko: '이자율' }, definition: { en: 'The percentage by which money grows (or a debt grows) per period, usually stated per year.', ko: '한 기간 동안 돈(또는 빚)이 늘어나는 비율. 보통 1년 기준으로 표시한다.' } },
    { id: 'compounding', label: { en: 'compounding', ko: '복리' }, definition: { en: 'Earning growth on previous growth, not only on the original amount.', ko: '원금뿐 아니라 이전에 붙은 수익 위에도 다시 수익이 붙는 것.' } },
    { id: 'compounding-period', label: { en: 'compounding period', ko: '복리 주기' }, definition: { en: 'How often growth is added to the balance: yearly, monthly, daily, or continuously.', ko: '수익이 잔액에 더해지는 빈도. 연, 월, 일, 또는 연속.' } },
    { id: 'exponential-growth', label: { en: 'exponential growth', ko: '지수적 성장' }, definition: { en: 'Growth that multiplies by a constant factor each period, so it accelerates instead of adding a fixed amount.', ko: '매 기간 일정한 배율로 곱해져서, 일정 금액씩 더해지는 것이 아니라 점점 빨라지는 성장.' } },
    { id: 'rule-of-72', label: { en: 'rule of 72', ko: '72의 법칙' }, definition: { en: 'A shortcut: divide 72 by the yearly rate in percent to estimate how many years money takes to double.', ko: '72를 연이율(%)로 나누면 돈이 두 배가 되는 데 걸리는 햇수를 어림할 수 있다는 지름길.' } },
    { id: 'annuity', label: { en: 'annuity (regular contributions)', ko: '정기 납입(연금 흐름)' }, definition: { en: 'A stream of equal, regular contributions or payments, such as 200 every month.', ko: '매달 200처럼 같은 금액을 규칙적으로 넣거나 내는 흐름.' } },
    { id: 'inflation', label: { en: 'inflation', ko: '인플레이션' }, definition: { en: 'The general rise in prices over time, which shrinks what a fixed amount of money can buy.', ko: '시간이 지나며 물가가 전반적으로 오르는 것. 같은 돈으로 살 수 있는 양이 줄어든다.' } },
    { id: 'real-return', label: { en: 'real return', ko: '실질 수익률' }, definition: { en: 'Return after subtracting inflation: what your purchasing power actually gains.', ko: '인플레이션을 뺀 수익률. 구매력이 실제로 얼마나 늘었는지를 뜻한다.' } },
    { id: 'fee-drag', label: { en: 'fee drag', ko: '수수료 잠식' }, definition: { en: 'The compounding loss caused by fees subtracted from the return every year.', ko: '매년 수익률에서 빠져나가는 수수료가 복리로 누적되어 생기는 손실.' } },
    { id: 'volatility-drag', label: { en: 'volatility drag', ko: '변동성 잠식' }, definition: { en: 'The gap between the average of yearly returns and the compound growth you actually get, caused by ups and downs.', ko: '오르내림 때문에 연평균 수익률과 실제 복리 성장률 사이에 생기는 차이.' } },
  ],
  blocks: [
    // ---------------- The one idea ----------------
    { id: 'h-one-idea', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'The one idea', ko: '단 하나의 아이디어' } },
    {
      id: 'idea-novice', kind: 'para', levels: ['novice'], priority: 1, section: 'h-one-idea', teaches: ['compounding'],
      text: {
        en: 'Picture a snowball rolling downhill. It picks up snow, and the new snow makes it bigger, so it picks up even more snow on the next turn. Money that earns a return behaves the same way. The return you earned last year sits in the account, and this year it earns a return of its own. That is **compounding**: growth on top of growth. Nothing about it is clever or risky by itself. It is simply what happens when you leave the gains where they are. The catch is that the snowball is tiny for a long time: for years it looks like nothing is happening, and then the growth from earlier growth starts to show. People who see only the first few turns usually conclude that it is not worth the bother.',
        ko: '눈덩이가 언덕을 굴러 내려가는 모습을 떠올려 보세요. 눈을 붙이고, 붙은 눈 덕에 더 커지고, 그래서 다음 바퀴에는 더 많은 눈을 붙입니다. 수익을 내는 돈도 똑같이 움직입니다. 작년에 번 수익이 계좌에 남아 있고, 올해는 그 수익이 다시 자기 몫의 수익을 냅니다. 그것이 **복리**입니다. 성장 위의 성장이죠. 그 자체로 영리하거나 위험한 것은 전혀 없습니다. 번 돈을 그 자리에 놔두면 그냥 일어나는 일입니다. 함정은 눈덩이가 오랫동안 아주 작다는 것입니다. 몇 년 동안은 아무 일도 없는 것처럼 보이다가, 앞선 성장에서 나온 성장이 드러나기 시작합니다. 처음 몇 바퀴만 본 사람은 대개 굳이 할 가치가 없다고 결론짓습니다.',
      },
    },
    {
      id: 'idea-intermediate', kind: 'para', levels: ['intermediate'], priority: 1, section: 'h-one-idea', teaches: ['compounding'],
      text: {
        en: 'Put 100 in an account paying 7% a year. After one year you have 107. The second year you earn 7% of 107, not of 100, so you end at 114.49 rather than 114. That extra 0.49 is small, but it is the whole story: the return earns a return. **Compounding** means each period’s growth is calculated on the full balance, gains included. Over a few years the effect is barely visible. Over decades it dominates everything else you can control.',
        ko: '연 7%를 주는 계좌에 100을 넣습니다. 1년 뒤 107이 됩니다. 2년째에는 100이 아니라 107의 7%를 벌기 때문에 114가 아니라 114.49로 끝납니다. 그 0.49는 작지만, 이야기의 전부입니다. 수익이 수익을 번다는 것이죠. **복리**란 매 기간의 성장이 수익을 포함한 잔액 전체를 기준으로 계산된다는 뜻입니다. 몇 년만 보면 효과가 거의 보이지 않습니다. 수십 년이 지나면 당신이 통제할 수 있는 다른 모든 것을 압도합니다.',
      },
    },
    {
      id: 'idea-expert', kind: 'para', levels: ['expert'], priority: 1, section: 'h-one-idea', teaches: ['compounding', 'exponential-growth'],
      text: {
        en: 'Compounding is a multiplicative process: each period the balance is multiplied by (1 + r), so after t periods it is P(1 + r)^t. On a log scale that is a straight line with slope ln(1 + r), which is why small differences in the exponent, meaning time, matter more than modest differences in the base, meaning rate, once t is large. Everything practical in this article follows from that asymmetry: the exponent is where the leverage lives.',
        ko: '복리는 곱셈 과정입니다. 매 기간 잔액에 (1 + r)이 곱해지므로 t기간 뒤에는 P(1 + r)^t가 됩니다. 로그 눈금에서는 기울기가 ln(1 + r)인 직선이 되는데, 그래서 t가 커지면 지수(시간)의 작은 차이가 밑(수익률)의 어지간한 차이보다 더 중요해집니다. 이 글의 실용적인 내용은 모두 그 비대칭에서 나옵니다. 지렛대는 지수에 있습니다.',
      },
    },
    {
      id: 'worked-number', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 1, section: 'h-one-idea', requires: ['compounding'],
      text: {
        en: 'One number to keep. Leave **10,000** alone for 30 years at 7% a year, compounded yearly, and it becomes **76,123**. Simple interest, where only the original 10,000 earns 7% each year, would give 31,000. The difference, 45,123, is interest earned on interest. More than half of the final amount came from money that was never deposited. It arrived only because the gains were allowed to stay and grow.',
        ko: '기억해 둘 숫자 하나. **10,000**을 연 7%로 30년 동안 연복리로 그냥 두면 **76,123**이 됩니다. 원금 10,000에만 매년 7%가 붙는 단리라면 31,000입니다. 그 차이 45,123이 이자에 붙은 이자입니다. 최종 금액의 절반 이상이 한 번도 입금한 적 없는 돈에서 왔습니다. 수익을 그 자리에 두고 자라게 했기 때문에 생긴 돈입니다.',
      },
    },
    {
      id: 'quote-author', kind: 'quote', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 'h-one-idea',
      text: {
        en: 'Compounding is not a trick of finance. It is what happens when growth is allowed to keep its own gains. The only ingredient it truly needs is time, and time is the one thing no one can buy back later.',
        ko: '복리는 금융의 묘기가 아닙니다. 성장이 자기 수익을 품고 있도록 허락할 때 일어나는 일입니다. 정말로 필요한 재료는 시간뿐이고, 시간은 나중에 다시 살 수 없는 유일한 것입니다.',
      },
    },

    // ---------------- The math, gently ----------------
    { id: 'h-math', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 2, text: { en: 'The math, gently', ko: '수학, 부드럽게' } },
    {
      id: 'math-novice', kind: 'para', levels: ['novice'], priority: 2, section: 'h-math', teaches: ['interest-rate', 'compounding-period'],
      text: {
        en: '“7% a year” means that once a year the balance is multiplied by 1.07. Two years: 1.07 × 1.07 = 1.1449. Three years: 1.07 × 1.07 × 1.07 ≈ 1.225. Ten years: about 1.967, nearly double. The **rate** is how big each multiplication is; the **compounding period** is how often it happens. Many accounts compound monthly, which means twelve smaller multiplications a year. Monthly compounding at 7% turns 10,000 into 81,165 after 30 years instead of 76,123, a little more because the gains start working sooner.',
        ko: '“연 7%”는 1년에 한 번 잔액에 1.07을 곱한다는 뜻입니다. 2년이면 1.07 × 1.07 = 1.1449. 3년이면 1.07 × 1.07 × 1.07 ≈ 1.225. 10년이면 약 1.967, 거의 두 배입니다. **이자율**은 각 곱셈의 크기이고, **복리 주기**는 그 곱셈이 얼마나 자주 일어나는지입니다. 많은 계좌가 월복리인데, 1년에 열두 번 더 작은 곱셈을 한다는 뜻입니다. 7% 월복리는 30년 뒤 10,000을 76,123이 아니라 81,165로 만듭니다. 수익이 더 일찍부터 일하기 때문에 조금 더 많습니다.',
      },
    },
    {
      id: 'exp-growth-teach', kind: 'para', levels: ['novice', 'intermediate'], priority: 3, section: 'h-math', teaches: ['exponential-growth'],
      text: {
        en: 'There are two ways a number can grow. Adding the same amount each year draws a straight line: 10,000, then 10,700, then 11,400. Multiplying by the same factor each year draws a curve that bends upward: 10,000, 10,700, 11,449, 12,250, and after thirty years 76,123. The first is linear growth; the second is **exponential growth**. They look almost identical at the start, which is exactly why compounding is so easy to underestimate. The bend only becomes obvious after the years you cannot get back.',
        ko: '숫자가 자라는 방식에는 두 가지가 있습니다. 매년 같은 금액을 더하면 직선이 됩니다. 10,000, 10,700, 11,400. 매년 같은 배율을 곱하면 위로 휘는 곡선이 됩니다. 10,000, 10,700, 11,449, 12,250, 그리고 30년 뒤 76,123. 앞의 것이 선형 성장, 뒤의 것이 **지수적 성장**입니다. 처음에는 거의 똑같아 보이는데, 바로 그래서 복리를 과소평가하기 쉽습니다. 휘어짐은 되돌릴 수 없는 세월이 지난 뒤에야 분명해집니다.',
      },
    },
    {
      id: 'math-formula', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 'h-math', teaches: ['compounding-period', 'interest-rate'], requires: ['exponential-growth'],
      text: {
        en: 'The full formula is A = P(1 + r/n)^(nt): P is the starting amount, r the yearly rate as a decimal, n the number of compounding periods per year, t the years. For 10,000 at 7% over 30 years: yearly compounding (n = 1) gives 10,000 × 1.07^30 = **76,123**; monthly compounding (n = 12) gives 10,000 × (1 + 0.07/12)^360 = **81,165**. Compounding more often helps, but notice how little: the exponent nt is doing almost all of the work, and the exponent is time.',
        ko: '완전한 공식은 A = P(1 + r/n)^(nt)입니다. P는 시작 금액, r은 소수로 쓴 연이율, n은 1년당 복리 횟수, t는 햇수입니다. 10,000을 7%로 30년 굴리면, 연복리(n = 1)는 10,000 × 1.07^30 = **76,123**, 월복리(n = 12)는 10,000 × (1 + 0.07/12)^360 = **81,165**입니다. 더 자주 복리하면 도움이 되지만, 얼마나 적게 도움이 되는지 보세요. 일을 거의 다 하는 것은 지수 nt이고, 지수는 시간입니다.',
      },
    },
    {
      id: 'math-continuous', kind: 'para', levels: ['expert'], priority: 3, section: 'h-math', requires: ['compounding-period'],
      text: {
        en: 'Push n toward infinity and (1 + r/n)^(nt) converges to e^(rt): continuous compounding. For 10,000 at 7% over 30 years that limit is 10,000 × e^2.1 = **81,662**. Daily compounding already gives 81,645, monthly 81,165, yearly 76,123. The sequence shows why arguing about compounding frequency is mostly noise: going from yearly to monthly adds about 6.6%, going from monthly to continuous adds 0.6%. Adding five more years at the same rate adds 40%.',
        ko: 'n을 무한대로 보내면 (1 + r/n)^(nt)는 e^(rt), 즉 연속 복리로 수렴합니다. 10,000을 7%로 30년 굴린 극한값은 10,000 × e^2.1 = **81,662**입니다. 일복리는 이미 81,645, 월복리는 81,165, 연복리는 76,123입니다. 이 수열은 복리 빈도를 따지는 것이 대부분 소음인 이유를 보여 줍니다. 연복리에서 월복리로 가면 약 6.6%가 늘고, 월복리에서 연속 복리로 가면 0.6%가 늡니다. 같은 수익률로 5년을 더하면 40%가 늡니다.',
      },
    },
    {
      id: 'rule-72', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 'h-math', teaches: ['rule-of-72'],
      text: {
        en: 'For quick estimates, use the **rule of 72**: divide 72 by the yearly rate in percent and you get the years to double. At 7%, 72 / 7 ≈ 10.3 years (exactly 10.2). At 3%, about 24 years (exactly 23.4). At 10%, about 7 years (exactly 7.3). Thirty years at 7% is therefore roughly three doublings: 10,000 → 20,000 → 40,000 → 80,000, which is why 76,123 should not surprise you. The exact doubling time is ln 2 / ln(1 + r).',
        ko: '빠른 어림에는 **72의 법칙**을 쓰세요. 72를 연이율(%)로 나누면 두 배가 되는 햇수가 나옵니다. 7%면 72 / 7 ≈ 10.3년(정확히는 10.2년). 3%면 약 24년(정확히 23.4년). 10%면 약 7년(정확히 7.3년). 그러니 7%로 30년은 대략 세 번의 두 배입니다. 10,000 → 20,000 → 40,000 → 80,000. 76,123이 놀랍지 않은 이유입니다. 정확한 두 배 기간은 ln 2 / ln(1 + r)입니다.',
      },
    },
    {
      id: 'rule-72-novice', kind: 'para', levels: ['novice'], priority: 2, section: 'h-math', teaches: ['rule-of-72'], simplerOf: 'rule-72',
      text: {
        en: 'Here is a shortcut you can do in your head. Divide 72 by the yearly percentage and you get roughly how many years it takes money to double. At 7% a year: 72 ÷ 7 is about 10, so money doubles about every 10 years. Thirty years is three doublings: 10,000 becomes 20,000, then 40,000, then 80,000. The true answer, 76,123, is close. At 3%, doubling takes about 24 years. At 10%, about 7. This is the **rule of 72**. It is also a good way to feel the difference a rate makes: at 1%, doubling takes about 72 years, longer than most working lives, which is why money left in a near-zero account is barely compounding at all.',
        ko: '암산으로 되는 지름길입니다. 72를 연 퍼센트로 나누면 돈이 두 배가 되는 데 걸리는 햇수가 대략 나옵니다. 연 7%라면 72 ÷ 7은 약 10이니, 돈은 약 10년마다 두 배가 됩니다. 30년은 세 번의 두 배입니다. 10,000이 20,000이 되고, 40,000이 되고, 80,000이 됩니다. 진짜 답 76,123과 가깝죠. 3%면 두 배까지 약 24년, 10%면 약 7년입니다. 이것이 **72의 법칙**입니다. 수익률 차이를 몸으로 느끼기에도 좋은 방법입니다. 1%면 두 배까지 약 72년, 대부분의 직장 생활보다 긴 시간이 걸립니다. 거의 0에 가까운 계좌에 둔 돈이 사실상 복리가 되지 않는 이유입니다.',
      },
    },
    {
      id: 'annuity-block', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 'h-math', teaches: ['annuity'], requires: ['compounding-period'],
      text: {
        en: 'Most people do not invest a lump sum; they add a little every month. Equal regular contributions are called an **annuity**, and their future value is FV = C × ((1 + i)^n − 1) / i, where C is the contribution, i the monthly rate (0.07 / 12) and n the number of months. Contribute **200 a month** for 30 years at 7%, compounded monthly with each contribution made at month end, and you deposit 72,000 but finish with **243,994**. Two-thirds of the final amount is growth.',
        ko: '대부분의 사람은 목돈을 한 번에 넣지 않고 매달 조금씩 더합니다. 같은 금액의 정기 납입을 **정기 납입(연금 흐름)**이라 하고, 그 미래 가치는 FV = C × ((1 + i)^n − 1) / i입니다. C는 납입액, i는 월 이율(0.07 / 12), n은 개월 수입니다. **매달 200**을 30년 동안 7% 월복리로, 매달 말에 납입하면, 넣은 돈은 72,000이지만 **243,994**로 끝납니다. 최종 금액의 3분의 2가 성장분입니다.',
      },
    },
    {
      id: 'annuity-novice', kind: 'para', levels: ['novice'], priority: 2, section: 'h-math', teaches: ['annuity'], simplerOf: 'annuity-block',
      text: {
        en: 'You do not need a lump sum. Adding a fixed amount every month works the same way, and the numbers are just as surprising. Put in **200 a month** for 30 years at 7% and you will have deposited 72,000 in total. The account, however, ends at about **243,994**. Roughly two out of every three units in it were never deposited by you; they grew there. Regular, boring contributions are how most people actually get to compound. The trick is not the size of the monthly amount but the fact that it never stops: an automatic transfer you forget about will quietly outperform a large deposit you keep meaning to make.',
        ko: '목돈은 필요 없습니다. 매달 일정 금액을 더하는 것도 똑같이 작동하고, 숫자는 똑같이 놀랍습니다. **매달 200**을 30년 동안 7%로 넣으면 넣은 돈은 모두 72,000입니다. 그런데 계좌는 약 **243,994**로 끝납니다. 그 안의 돈 셋 중 둘은 당신이 넣은 적이 없는 돈이고, 거기서 자란 돈입니다. 규칙적이고 지루한 납입이야말로 대부분의 사람이 실제로 복리에 올라타는 방법입니다. 비결은 월 납입액의 크기가 아니라 멈추지 않는다는 사실입니다. 잊고 지내는 자동 이체가, 언젠가 하려고 마음만 먹는 큰 입금을 조용히 앞지릅니다.',
      },
    },
    {
      id: 'code-fv', kind: 'code', levels: ['intermediate', 'expert'], priority: 4, section: 'h-math', goals: ['build'], requires: ['annuity'],
      text: {
        en: 'function futureValue(principal, monthly, ratePct, years, feePct = 0) {\n  const i = (ratePct - feePct) / 100 / 12, n = years * 12;\n  const growth = (1 + i) ** n;\n  const contributions = i === 0 ? monthly * n : monthly * (growth - 1) / i;\n  return Math.round(principal * growth + contributions);\n}\n// futureValue(10000, 200, 7, 30) → 325159',
        ko: 'function futureValue(principal, monthly, ratePct, years, feePct = 0) {\n  const i = (ratePct - feePct) / 100 / 12, n = years * 12;\n  const growth = (1 + i) ** n;\n  const contributions = i === 0 ? monthly * n : monthly * (growth - 1) / i;\n  return Math.round(principal * growth + contributions);\n}\n// futureValue(10000, 200, 7, 30) → 325159',
      },
    },

    // ---------------- Time versus rate ----------------
    { id: 'h-time', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Time versus rate', ko: '시간 대 수익률' } },
    {
      id: 'time-beats-rate', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 1, section: 'h-time', requires: ['compounding'],
      text: {
        en: 'Two savers, same 200 a month, same 7%. The first starts at 25, contributes for ten years, then **stops forever**: 24,000 in. The second starts at 35 and contributes for thirty years without missing a month: 72,000 in. At 65 the first has about **280,968**; the second has about **243,994**. The one who put in a third of the money finishes ahead, because those first ten years of deposits had thirty more years to compound. Time is the ingredient; the rate only sets how fast the clock runs.',
        ko: '두 명의 저축자, 똑같이 매달 200, 똑같이 7%. 첫 번째는 25살에 시작해 10년 넣고 **영원히 멈춥니다**. 넣은 돈 24,000. 두 번째는 35살에 시작해 한 달도 빠짐없이 30년을 넣습니다. 넣은 돈 72,000. 65살에 첫 번째는 약 **280,968**, 두 번째는 약 **243,994**를 갖습니다. 돈을 3분의 1만 넣은 사람이 앞서는 이유는, 처음 10년의 납입액이 30년을 더 복리로 굴렀기 때문입니다. 재료는 시간입니다. 수익률은 시계가 얼마나 빨리 가는지를 정할 뿐입니다.',
      },
    },
    {
      id: 'figure-curves', kind: 'figure', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 'h-time', figure: 'start-early',
      text: {
        en: 'Two savers, 200 a month at 7%. Red: starts at 25, stops at 35, deposits 24,000. Green: starts at 35, never stops, deposits 72,000. By 65 the red line is still ahead.',
        ko: '두 저축자, 매달 200, 7%. 빨강: 25살에 시작해 35살에 멈춤, 납입 24,000. 초록: 35살에 시작해 멈추지 않음, 납입 72,000. 65살에도 빨간 선이 여전히 앞섭니다.',
      },
    },
    {
      id: 'rate-vs-time', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 'h-time', goals: ['decide'],
      text: {
        en: 'People chase rate because it feels like the lever they can pull today. Compare two plans with 200 a month: thirty years at a hard-to-get 10% ends near **452,098**; forty years at an ordinary 7% ends near **524,963**. Ten extra years at the lower rate beat three extra percentage points held for three decades. Chasing an extra point usually means taking more risk or paying more attention; starting a decade earlier costs nothing but a decision.',
        ko: '사람들은 수익률을 좇습니다. 오늘 당길 수 있는 지렛대처럼 느껴지기 때문입니다. 매달 200으로 두 계획을 비교해 보죠. 얻기 어려운 10%로 30년이면 약 **452,098**, 평범한 7%로 40년이면 약 **524,963**입니다. 낮은 수익률로 10년을 더한 쪽이, 30년 내내 3%포인트를 더 얻은 쪽을 이깁니다. 1%포인트를 더 좇는 것은 대개 위험을 더 지거나 신경을 더 쓰는 일이고, 10년 먼저 시작하는 것은 결심 말고는 아무 비용도 들지 않습니다.',
      },
    },
    {
      id: 'rate-vs-time-expert', kind: 'para', levels: ['expert'], priority: 3, section: 'h-time', goals: ['decide'], requires: ['exponential-growth'],
      text: {
        en: 'Formally, the sensitivity of ln A to time is ln(1 + r) per year, constant, while its sensitivity to rate is t / (1 + r), which grows with horizon. At t = 30 and r = 7%, one extra year adds about 6.8% to the final amount, and one extra percentage point of return adds about 28%; a decade adds 93%. The catch is what each costs: an extra point of expected return is usually bought with variance, fees, or concentration, while an extra decade is bought with an earlier start.',
        ko: '형식적으로 말하면, ln A의 시간에 대한 민감도는 연당 ln(1 + r)로 일정하고, 수익률에 대한 민감도는 t / (1 + r)로 기간이 길수록 커집니다. t = 30, r = 7%에서 1년을 더하면 최종 금액이 약 6.8% 늘고, 수익률 1%포인트를 더하면 약 28%, 10년을 더하면 93% 늡니다. 함정은 각각의 비용입니다. 기대 수익률 1%포인트는 대개 분산, 수수료, 집중이라는 값을 치르고 사는 것이고, 10년은 더 이른 시작으로 사는 것입니다.',
      },
    },
    {
      id: 'aside-patience', kind: 'aside', levels: ['novice', 'intermediate', 'expert'], priority: 4, section: 'h-time',
      text: {
        en: 'Why this feels wrong: human intuition is linear. We expect thirty years of saving to be worth about three times ten years of saving. In a compounding world the last decade of a long run produces more than the first two combined, which is also why stopping early is so costly and why the numbers in this article keep looking like typos.',
        ko: '왜 이것이 틀린 것처럼 느껴질까요. 사람의 직관은 선형입니다. 30년 저축이 10년 저축의 세 배쯤일 거라고 기대하죠. 복리의 세계에서는 긴 여정의 마지막 10년이 앞의 20년을 합친 것보다 많이 만들어 냅니다. 그래서 일찍 멈추는 것이 그토록 비싸고, 이 글의 숫자들이 자꾸 오타처럼 보이는 것입니다.',
      },
    },

    // ---------------- The things that compound against you ----------------
    { id: 'h-against', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 2, text: { en: 'The things that compound against you', ko: '당신에게 불리하게 복리로 쌓이는 것들' } },
    {
      id: 'fees', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 'h-against', teaches: ['fee-drag'], goals: ['decide'],
      text: {
        en: 'Fees compound too, in reverse. A 1% yearly fee on a 7% return leaves 6%. Over 30 years, 10,000 compounded yearly grows to 57,435 instead of 76,123: the fee took **18,688, almost a quarter** of what you would have had. At 2%, you keep 43,219 and lose 43%. The fee looks tiny because it is quoted per year; its cost is paid at the exponent. This is **fee drag**, and it is the most reliable return most people can add to their plan.',
        ko: '수수료도 복리로 쌓입니다. 거꾸로요. 7% 수익률에 연 1% 수수료면 6%가 남습니다. 30년 동안 연복리로 10,000은 76,123이 아니라 57,435가 됩니다. 수수료가 **18,688, 거의 4분의 1**을 가져간 것입니다. 2%면 43,219가 남고 43%를 잃습니다. 수수료는 1년 기준으로 표시되기 때문에 작아 보이지만, 그 비용은 지수에서 치릅니다. 이것이 **수수료 잠식**이고, 대부분의 사람이 자기 계획에 더할 수 있는 가장 확실한 수익입니다.',
      },
    },
    {
      id: 'fees-expert', kind: 'para', levels: ['expert'], priority: 4, section: 'h-against', requires: ['fee-drag'],
      text: {
        en: 'The share of terminal wealth lost to a fee f on a gross return r over t years is 1 − ((1 + r − f) / (1 + r))^t. With r = 7%, f = 1%, t = 30 that is 1 − (1.06 / 1.07)^30 ≈ 24.5%; at f = 2% it is 43.2%. The loss is roughly linear in f for small f but grows with t like everything else here, so a fee that is negligible over five years is material over thirty and dominant over fifty.',
        ko: '총수익률 r, 기간 t년에서 수수료 f가 최종 자산에서 가져가는 비율은 1 − ((1 + r − f) / (1 + r))^t입니다. r = 7%, f = 1%, t = 30이면 1 − (1.06 / 1.07)^30 ≈ 24.5%, f = 2%면 43.2%입니다. 작은 f에 대해서는 손실이 대략 f에 비례하지만, 여기의 다른 모든 것처럼 t와 함께 커집니다. 5년이면 무시할 만한 수수료가 30년이면 중요해지고 50년이면 지배적이 됩니다.',
      },
    },
    {
      id: 'inflation-block', kind: 'para', levels: ['intermediate', 'expert'], priority: 3, section: 'h-against', teaches: ['inflation', 'real-return'],
      text: {
        en: '**Inflation** compounds against you silently. If prices rise 3% a year, the **real return** on a 7% investment is not 4% but (1.07 / 1.03) − 1 ≈ 3.9%. Your 76,123 after 30 years buys what **31,361** buys today, because 1.03^30 ≈ 2.43. The nominal number still grew sevenfold; the purchasing power grew threefold. Both are real gains, but only the second one pays for groceries, which is why long-term plans should be built on real, not nominal, returns.',
        ko: '**인플레이션**은 조용히 당신에게 불리하게 복리로 쌓입니다. 물가가 매년 3% 오르면 7% 투자의 **실질 수익률**은 4%가 아니라 (1.07 / 1.03) − 1 ≈ 3.9%입니다. 30년 뒤의 76,123은 오늘의 **31,361**이 사는 만큼을 삽니다. 1.03^30 ≈ 2.43이기 때문입니다. 명목 숫자는 여전히 7배로 자랐지만 구매력은 3배로 자랐습니다. 둘 다 진짜 이득이지만 장을 볼 수 있는 것은 두 번째뿐이고, 그래서 장기 계획은 명목이 아니라 실질 수익률 위에 세워야 합니다.',
      },
    },
    {
      id: 'inflation-novice', kind: 'para', levels: ['novice'], priority: 3, section: 'h-against', teaches: ['inflation', 'real-return'], simplerOf: 'inflation-block',
      text: {
        en: 'Prices creep up over time; that is **inflation**. It means the number in your account can grow while what it buys grows more slowly. If prices rise 3% a year for 30 years, everything costs about 2.4 times as much. So the 76,123 from earlier would buy roughly what 31,361 buys today. Still a big win compared with 10,000, but smaller than it looks. When you plan, think in terms of what the money will buy, not the number on the screen. A useful habit is to subtract about three percentage points from any return before you get excited about it; the rest is closer to what will actually land in your life.',
        ko: '물가는 시간이 지나며 슬금슬금 오릅니다. 그것이 **인플레이션**입니다. 계좌의 숫자는 자라는데 그 돈으로 살 수 있는 양은 더 천천히 자란다는 뜻입니다. 물가가 30년 동안 매년 3% 오르면 모든 것이 약 2.4배 비싸집니다. 그러니 앞서 본 76,123은 오늘의 31,361이 사는 만큼을 삽니다. 10,000과 비교하면 여전히 큰 승리지만, 보이는 것보다는 작습니다. 계획할 때는 화면의 숫자가 아니라 그 돈이 무엇을 살 수 있는지로 생각하세요. 유용한 습관 하나는 어떤 수익률이든 들뜨기 전에 3%포인트쯤 빼고 보는 것입니다. 남는 것이 실제로 당신의 삶에 닿을 몫에 더 가깝습니다.',
      },
    },
    {
      id: 'debt', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 'h-against', requires: ['compounding'], goals: ['decide'],
      text: {
        en: 'Debt is compounding pointed at you. A credit card balance of 5,000 at 20% a year, compounded monthly and left unpaid, becomes about **13,480 in five years**; at that rate a balance doubles every three and a half years. The same math that makes patient saving powerful makes carrying high-rate debt ruinous. In almost every case, paying down a 20% debt is a guaranteed 20% return, which nothing else in this article can promise.',
        ko: '빚은 당신을 향한 복리입니다. 연 20%짜리 신용카드 잔액 5,000을 월복리로 갚지 않고 두면 **5년 뒤 약 13,480**이 됩니다. 그 이율에서는 잔액이 3년 반마다 두 배가 됩니다. 인내하는 저축을 강력하게 만드는 바로 그 수학이 고금리 빚을 파멸적으로 만듭니다. 거의 모든 경우 20% 빚을 갚는 것은 보장된 20% 수익이고, 이 글의 어떤 것도 그것을 약속하지는 못합니다.',
      },
    },
    {
      id: 'volatility-expert', kind: 'para', levels: ['expert'], priority: 4, section: 'h-against', teaches: ['volatility-drag'],
      text: {
        en: 'Real returns arrive in a sequence, not as a constant. Gain 50% one year and lose 50% the next and the arithmetic mean is 0%, yet the balance is 0.75 of where it started: a compound return of −13.4% a year. That gap is **volatility drag**, approximately σ² / 2. Order matters as well once cash flows exist: the same set of yearly returns produces different outcomes depending on whether the bad years fall early or late in a period of contributions or withdrawals. Constant-rate formulas are a map, not the territory.',
        ko: '실제 수익률은 상수가 아니라 순서를 가진 열로 옵니다. 한 해 50%를 벌고 다음 해 50%를 잃으면 산술 평균은 0%인데 잔액은 시작의 0.75, 즉 연 −13.4%의 복리 수익률입니다. 그 차이가 **변동성 잠식**이고 대략 σ² / 2입니다. 현금 흐름이 있으면 순서도 중요합니다. 같은 연간 수익률 집합이라도 나쁜 해가 납입이나 인출 기간의 초반에 오느냐 후반에 오느냐에 따라 결과가 달라집니다. 고정 수익률 공식은 지도이지 땅이 아닙니다.',
      },
    },

    // ---------------- Try it ----------------
    { id: 'h-try', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 3, text: { en: 'Try it with your own numbers', ko: '당신의 숫자로 직접 해 보기' } },
    {
      id: 'interactive-calc', kind: 'interactive', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 'h-try', interactive: 'compound-calculator',
      text: {
        en: 'Change the starting amount, the monthly contribution, the rate, the years, or the fee, and watch the curve. If you are reading with an agent, ask it to run scenarios for you: “what if I start five years later?”, “what does a 1% fee cost me?”. It can set these numbers directly.',
        ko: '시작 금액, 월 납입액, 수익률, 기간, 수수료를 바꾸며 곡선을 보세요. 에이전트와 함께 읽고 있다면 시나리오를 대신 돌려 달라고 하세요. “5년 늦게 시작하면?”, “1% 수수료는 얼마를 가져가나?”. 에이전트가 이 숫자들을 직접 바꿀 수 있습니다.',
      },
    },
    {
      id: 'aside-assumptions', kind: 'aside', levels: ['novice', 'intermediate', 'expert'], priority: 5, section: 'h-try',
      text: {
        en: 'What the calculator assumes: a constant yearly rate, monthly compounding, contributions made at the end of each month, a fee subtracted from the rate, and no taxes. Real investments have none of these guarantees. The tool shows the shape of compounding, not a forecast.',
        ko: '계산기의 가정: 일정한 연 수익률, 월복리, 매달 말 납입, 수익률에서 차감되는 수수료, 세금 없음. 실제 투자에는 이런 보장이 하나도 없습니다. 이 도구는 복리의 모양을 보여 주는 것이지 예측이 아닙니다.',
      },
    },

    // ---------------- What to do this week ----------------
    { id: 'h-do', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'What to do this week', ko: '이번 주에 할 일' } },
    {
      id: 'action-one', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 1, section: 'h-do',
      text: {
        en: 'If you do one thing: set up an **automatic monthly transfer** into a long-term account, however small, and do it this week rather than after you have “sorted things out”. The amount can grow later. The start date cannot move earlier later. Everything in this article is illustrative math, not advice about any particular product; the one universal lesson is that the calendar is the lever.',
        ko: '한 가지만 한다면, 장기 계좌로 들어가는 **자동 월 이체**를 아무리 작더라도 설정하세요. “정리가 끝난 뒤”가 아니라 이번 주에요. 금액은 나중에 키울 수 있습니다. 시작일은 나중에 앞당길 수 없습니다. 이 글의 모든 내용은 예시를 위한 수학이지 특정 상품에 대한 조언이 아닙니다. 보편적인 교훈 하나는, 지렛대는 달력이라는 것입니다.',
      },
    },
    {
      id: 'checklist', kind: 'list', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 'h-do', goals: ['build'],
      text: {
        en: '- Automate a monthly contribution today; increase it when income rises.\n- Pay down any debt above roughly 10% first; it is a guaranteed return.\n- Know the total yearly fee on every account, in percent, and prefer lower.\n- Plan in real terms: subtract expected inflation from expected return.\n- Leave gains where they are; withdrawing resets the exponent.',
        ko: '- 오늘 월 자동 납입을 설정하고, 소득이 오르면 늘리세요.\n- 대략 10%가 넘는 빚은 먼저 갚으세요. 보장된 수익입니다.\n- 모든 계좌의 연간 총수수료를 퍼센트로 파악하고 낮은 쪽을 택하세요.\n- 실질 기준으로 계획하세요. 기대 수익률에서 기대 인플레이션을 빼세요.\n- 수익은 그 자리에 두세요. 인출은 지수를 처음으로 되돌립니다.',
      },
    },
  ],
  faq: [
    {
      id: 'debt-first', keywords: ['debt', 'credit card', 'loan', 'pay off', '빚', '대출', '신용카드', '갚'],
      question: { en: 'Should I invest or pay off debt first?', ko: '투자가 먼저인가요, 빚 갚기가 먼저인가요?' },
      answer: { en: 'Compare the rates. Paying off a debt is a guaranteed return equal to its rate, and high-rate debt (credit cards at 15–25%) compounds against you faster than most investments can be expected to grow. Low-rate debt is a closer call and depends on your situation; that is a decision for you, not this article.', ko: '이율을 비교하세요. 빚을 갚는 것은 그 이율만큼의 보장된 수익이고, 고금리 빚(15–25%의 신용카드)은 대부분의 투자가 기대할 수 있는 성장보다 빠르게 당신에게 불리하게 쌓입니다. 저금리 빚은 더 미묘하고 상황에 달려 있습니다. 그것은 이 글이 아니라 당신이 내릴 결정입니다.' },
    },
    {
      id: 'mortgage', keywords: ['mortgage', 'house', 'home loan', 'amortiz', '주택담보', '모기지', '집', '주담대'],
      question: { en: 'Does a mortgage compound the same way?', ko: '주택담보대출도 같은 방식으로 복리인가요?' },
      answer: { en: 'A mortgage is amortized: each payment covers that month’s interest on the remaining balance plus some principal, so the balance falls instead of compounding upward. Extra principal payments early in the loan save the most interest because they remove balance that would have been charged interest for the longest time. The same time-sensitivity, in reverse.', ko: '주택담보대출은 분할 상환됩니다. 매달 납입금이 잔액에 대한 그달 이자와 원금 일부를 갚기 때문에 잔액은 복리로 불어나는 대신 줄어듭니다. 대출 초기의 추가 원금 상환이 이자를 가장 많이 아끼는 이유는, 가장 오래 이자가 붙었을 잔액을 없애기 때문입니다. 같은 시간 민감성이 거꾸로 작동하는 것입니다.' },
    },
    {
      id: 'inflation', keywords: ['inflation', 'prices', 'purchasing power', 'real', '물가', '인플레이션', '구매력', '실질'],
      question: { en: 'How do I account for inflation?', ko: '인플레이션은 어떻게 반영하나요?' },
      answer: { en: 'Use the real return: (1 + nominal) / (1 + inflation) − 1. With 7% nominal and 3% inflation that is about 3.9%. Run your plan with that rate and the results are already in today’s purchasing power.', ko: '실질 수익률을 쓰세요. (1 + 명목) / (1 + 인플레이션) − 1입니다. 명목 7%, 인플레이션 3%면 약 3.9%입니다. 그 수익률로 계획을 돌리면 결과가 이미 오늘의 구매력 기준입니다.' },
    },
    {
      id: 'fees', keywords: ['fee', 'fees', 'expense ratio', 'cost', '수수료', '보수', '비용'],
      question: { en: 'Do small fees really matter?', ko: '작은 수수료가 정말 중요한가요?' },
      answer: { en: 'Yes, because they are charged every year on the whole balance. A 1% yearly fee removes roughly a quarter of your final amount over 30 years at a 7% return; 2% removes over 40%. Always read fees as a share of your return, not as a small number.', ko: '네. 매년 잔액 전체에 부과되기 때문입니다. 7% 수익률에서 연 1% 수수료는 30년 동안 최종 금액의 약 4분의 1을 없애고, 2%는 40% 넘게 없앱니다. 수수료는 작은 숫자가 아니라 수익률의 몫으로 읽으세요.' },
    },
    {
      id: 'rule-72', keywords: ['rule of 72', 'double', 'doubling', '72', '두 배', '72의 법칙'],
      question: { en: 'Where does the rule of 72 come from?', ko: '72의 법칙은 어디서 나왔나요?' },
      answer: { en: 'Doubling takes ln 2 / ln(1 + r) years. For small r, ln(1 + r) ≈ r, so the time is about 0.693 / r; 72 is used instead of 69.3 because it divides neatly by 2, 3, 4, 6, 8, 9 and 12 and slightly corrects for the approximation at typical rates.', ko: '두 배까지는 ln 2 / ln(1 + r)년이 걸립니다. r이 작으면 ln(1 + r) ≈ r이라 약 0.693 / r이 되는데, 69.3 대신 72를 쓰는 이유는 2, 3, 4, 6, 8, 9, 12로 깔끔하게 나누어지고 보통의 이율에서 근사 오차를 약간 보정해 주기 때문입니다.' },
    },
    {
      id: 'frequency', keywords: ['monthly', 'yearly', 'daily', 'frequency', 'how often', '월복리', '연복리', '일복리', '주기', '얼마나 자주'],
      question: { en: 'Does monthly versus yearly compounding matter?', ko: '월복리와 연복리의 차이가 중요한가요?' },
      answer: { en: 'A little. For 10,000 at 7% over 30 years: yearly 76,123, monthly 81,165, daily 81,645, continuous 81,662. Frequency is worth a few percent; an extra decade is worth roughly double. Spend your attention on time and fees, not on frequency.', ko: '조금요. 10,000을 7%로 30년 굴리면 연복리 76,123, 월복리 81,165, 일복리 81,645, 연속 복리 81,662입니다. 빈도는 몇 퍼센트짜리이고, 10년 추가는 대략 두 배짜리입니다. 관심은 빈도가 아니라 시간과 수수료에 쓰세요.' },
    },
    {
      id: 'risk', keywords: ['risk', 'lose', 'loss', 'crash', 'guaranteed', 'volatil', '위험', '손실', '폭락', '보장', '변동'],
      question: { en: 'Is a 7% return guaranteed?', ko: '7% 수익률은 보장되나요?' },
      answer: { en: 'No. Every number in this article assumes a constant rate to show the shape of compounding. Real returns vary year to year, can be negative, and their ups and downs reduce the compound result below the average (volatility drag). Treat the figures as illustrations, not forecasts.', ko: '아닙니다. 이 글의 모든 숫자는 복리의 모양을 보여 주기 위해 일정한 수익률을 가정합니다. 실제 수익률은 해마다 달라지고 마이너스일 수도 있으며, 오르내림은 복리 결과를 평균보다 낮춥니다(변동성 잠식). 숫자들은 예측이 아니라 예시로 보세요.' },
    },
    {
      id: 'tax', keywords: ['tax', 'taxes', 'taxed', '세금', '과세', '절세'],
      question: { en: 'What about taxes?', ko: '세금은요?' },
      answer: { en: 'Taxes on gains act like a fee on the return, and taxes paid yearly hurt more than taxes paid once at the end, because they interrupt compounding. Many countries offer accounts that defer or exempt tax on long-term savings; the rules are local and change, so check yours.', ko: '수익에 대한 세금은 수익률에 붙는 수수료처럼 작동하고, 매년 내는 세금은 마지막에 한 번 내는 세금보다 더 해롭습니다. 복리를 끊기 때문입니다. 많은 나라가 장기 저축에 과세를 미루거나 면제하는 계좌를 제공합니다. 규정은 지역마다 다르고 바뀌니 자신의 것을 확인하세요.' },
    },
    {
      id: 'too-late', keywords: ['late', 'too late', 'old', '40', '50', 'behind', '늦', '나이', '이미'],
      question: { en: 'Is it too late for me to start?', ko: '지금 시작하기에는 너무 늦었나요?' },
      answer: { en: 'The math does not know your age; it only knows the years remaining. Twenty years at 6% still more than triples money (1.06^20 ≈ 3.2). Starting late means a larger contribution for the same goal, not that compounding stops working.', ko: '수학은 당신의 나이를 모릅니다. 남은 햇수만 압니다. 6%로 20년이면 돈은 여전히 세 배 넘게 됩니다(1.06^20 ≈ 3.2). 늦게 시작한다는 것은 같은 목표에 더 큰 납입이 필요하다는 뜻이지, 복리가 작동을 멈춘다는 뜻이 아닙니다.' },
    },
  ],
  figures: {
    'start-early': `<svg viewBox="0 0 1100 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two savers: starting at 25 and stopping at 35 finishes ahead of starting at 35 and never stopping">
<rect x="0" y="0" width="1100" height="420" fill="#f6f3ec"/>
<line x1="80" y1="380" x2="1060" y2="380" stroke="#1b1b1f" stroke-width="1.5"/>
<line x1="80" y1="40" x2="80" y2="380" stroke="#1b1b1f" stroke-width="1.5"/>
<line x1="80" y1="266.7" x2="1060" y2="266.7" stroke="#1b1b1f" stroke-opacity="0.12"/>
<line x1="80" y1="153.3" x2="1060" y2="153.3" stroke="#1b1b1f" stroke-opacity="0.12"/>
<line x1="80" y1="40" x2="1060" y2="40" stroke="#1b1b1f" stroke-opacity="0.12"/>
<text x="70" y="384" font-size="14" text-anchor="end" fill="#1b1b1f" font-family="sans-serif">0</text>
<text x="70" y="271" font-size="14" text-anchor="end" fill="#1b1b1f" font-family="sans-serif">100k</text>
<text x="70" y="158" font-size="14" text-anchor="end" fill="#1b1b1f" font-family="sans-serif">200k</text>
<text x="70" y="45" font-size="14" text-anchor="end" fill="#1b1b1f" font-family="sans-serif">300k</text>
<text x="80" y="404" font-size="14" text-anchor="middle" fill="#1b1b1f" font-family="sans-serif">25</text>
<text x="325" y="404" font-size="14" text-anchor="middle" fill="#1b1b1f" font-family="sans-serif">35</text>
<text x="570" y="404" font-size="14" text-anchor="middle" fill="#1b1b1f" font-family="sans-serif">45</text>
<text x="815" y="404" font-size="14" text-anchor="middle" fill="#1b1b1f" font-family="sans-serif">55</text>
<text x="1060" y="404" font-size="14" text-anchor="middle" fill="#1b1b1f" font-family="sans-serif">65 (age)</text>
<path d="M80 380 L202.5 363.8 L325 340.8 L447.5 324.4 L570 301.2 L692.5 268.2 L815 221.6 L937.5 155.4 L1060 61.6" fill="none" stroke="#e8462b" stroke-width="4" stroke-linejoin="round"/>
<path d="M325 380 L447.5 363.8 L570 340.8 L692.5 308.2 L815 261.9 L937.5 196.4 L1060 103.5" fill="none" stroke="#1fa66a" stroke-width="4" stroke-linejoin="round"/>
<rect x="80" y="372" width="245" height="8" fill="#e8462b" fill-opacity="0.25"/>
<rect x="325" y="372" width="735" height="8" fill="#1fa66a" fill-opacity="0.18"/>
<circle cx="1060" cy="61.6" r="5" fill="#e8462b"/>
<circle cx="1060" cy="103.5" r="5" fill="#1fa66a"/>
<text x="1050" y="56" font-size="15" text-anchor="end" fill="#e8462b" font-family="sans-serif" font-weight="bold">280,968</text>
<text x="1050" y="122" font-size="15" text-anchor="end" fill="#1fa66a" font-family="sans-serif" font-weight="bold">243,994</text>
<text x="100" y="66" font-size="15" fill="#e8462b" font-family="sans-serif" font-weight="bold">Start at 25, stop at 35 — 24,000 deposited (shaded years)</text>
<text x="100" y="90" font-size="15" fill="#1fa66a" font-family="sans-serif" font-weight="bold">Start at 35, never stop — 72,000 deposited</text>
<text x="100" y="112" font-size="13" fill="#1b1b1f" fill-opacity="0.7" font-family="sans-serif">200 a month, 7% a year, compounded monthly</text>
</svg>`,
  },
};
