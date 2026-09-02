import type { Article } from '../../shared/content';

// Article #3 — How your phone knows where you are.
// Facts: GPS orbit ≈ 20,200 km; signal travel ≈ 67 ms; c = 299,792,458 m/s (1 µs ≈ 300 m, 1 ns ≈ 30 cm);
// relativity: SR −7 µs/day, GR +45 µs/day, net +38 µs/day ≈ 11.4 km/day if uncorrected; satellite clocks
// tuned to 10.22999999543 MHz; L1 = 1575.42 MHz, C/A code 1,023 chips per ms (≈ 293 m per chip);
// navigation message 50 bit/s (≈ 30 s per ephemeris, 12.5 min full almanac); dual-frequency phones since 2018.

const CODE_EN = `const C = 299_792_458; // metres per second, exact by definition
const metresPerNanosecond = C / 1e9; // ≈ 0.2998 m

function timingErrorToMetres(nanoseconds) {
  return nanoseconds * metresPerNanosecond;
}

timingErrorToMetres(1);      // ≈ 0.3 m
timingErrorToMetres(1_000);  // ≈ 300 m  (one microsecond)
timingErrorToMetres(38_000); // ≈ 11,400 m — one day of uncorrected relativistic drift`;

const CODE_KO = `const C = 299_792_458; // 미터/초, 정의에 의해 정확한 값
const metresPerNanosecond = C / 1e9; // ≈ 0.2998 m

function timingErrorToMetres(nanoseconds) {
  return nanoseconds * metresPerNanosecond;
}

timingErrorToMetres(1);      // ≈ 0.3 m
timingErrorToMetres(1_000);  // ≈ 300 m  (1마이크로초)
timingErrorToMetres(38_000); // ≈ 11,400 m — 보정하지 않은 상대론적 편차 하루치`;

export const article: Article = {
  slug: 'gps',
  title: { en: 'How your phone knows where you are', ko: '휴대폰은 어떻게 내 위치를 아는가' },
  deck: {
    en: 'Thirty clocks in orbit, a phone that only listens, and the arithmetic of being late.',
    ko: '궤도 위의 시계 서른 개, 듣기만 하는 휴대폰, 그리고 늦게 도착한 정도를 계산하는 산수.',
  },
  author: 'Attune editors',
  date: '2026-09-02',
  interactives: {
    trilateration: {
      title: { en: 'Clock error and the fourth satellite', ko: '시계 오차와 네 번째 위성' },
      description: {
        en: 'A top-down map of a receiver and up to four satellites. Change the receiver clock error, the number of satellites, and whether one signal reflects off a building; the map shows the true position, the computed fix and the error in metres.',
        ko: '수신기와 최대 네 개의 위성을 위에서 내려다본 지도. 수신기 시계 오차, 사용하는 위성 수, 신호 하나가 건물에 반사되는지 여부를 바꾸면, 지도에 실제 위치·계산된 위치·오차(미터)가 표시됩니다.',
      },
      params: {
        clockErrorNs: { type: 'number', description: 'Receiver clock error in nanoseconds', min: 0, max: 5000, default: 100 },
        satellites: { type: 'number', description: 'Number of satellites used', min: 3, max: 4, default: 4 },
        multipath: { type: 'boolean', description: 'Simulate reflections off buildings', default: false },
      },
    },
  },
  concepts: [
    { id: 'speed-of-light', label: { en: 'speed of light', ko: '빛의 속도' }, definition: { en: 'Light and radio travel about 299,792 km per second: about 30 cm in one nanosecond, 300 m in one microsecond.', ko: '빛과 전파는 초당 약 299,792km를 이동한다. 1나노초에 약 30cm, 1마이크로초에 300m.' } },
    { id: 'trilateration', label: { en: 'trilateration', ko: '삼변측량' }, definition: { en: 'Finding a point from its distances to several known points (spheres intersecting), as opposed to triangulation, which uses angles.', ko: '여러 알려진 점까지의 거리(구들의 교차)로 위치를 찾는 방법. 각도를 쓰는 삼각측량과는 다르다.' } },
    { id: 'atomic-clock', label: { en: 'atomic clock', ko: '원자시계' }, definition: { en: 'A clock that keeps time by counting a fixed vibration of atoms, stable to nanoseconds per day.', ko: '원자의 일정한 진동을 세어 시간을 지키는 시계. 하루에 나노초 수준으로 안정적이다.' } },
    { id: 'clock-bias', label: { en: 'receiver clock bias', ko: '수신기 시계 편차' }, definition: { en: 'The unknown offset between the receiver’s cheap clock and satellite time, solved as a fourth unknown alongside position.', ko: '수신기의 값싼 시계와 위성 시각 사이의 미지의 오프셋. 위치와 함께 네 번째 미지수로 풀린다.' } },
    { id: 'pseudorange', label: { en: 'pseudorange', ko: '의사거리' }, definition: { en: 'The distance computed from signal travel time before the receiver clock error is removed; the raw GNSS measurement.', ko: '수신기 시계 오차를 제거하기 전에 신호 이동 시간으로 계산한 거리. GNSS의 원시 측정값.' } },
    { id: 'ionosphere', label: { en: 'ionosphere', ko: '전리층' }, definition: { en: 'A layer of charged particles roughly 60–1,000 km up that delays radio signals, more at lower frequencies.', ko: '고도 약 60~1,000km의 하전 입자 층. 전파를 지연시키며 낮은 주파수일수록 더 그렇다.' } },
    { id: 'multipath', label: { en: 'multipath', ko: '다중경로' }, definition: { en: 'A signal reaching the receiver by a reflected, longer path, which makes the satellite look farther away than it is.', ko: '신호가 반사되어 더 긴 경로로 수신기에 도달하는 현상. 위성이 실제보다 멀리 있는 것처럼 보이게 한다.' } },
    { id: 'dop', label: { en: 'dilution of precision (DOP)', ko: '정밀도 저하율(DOP)' }, definition: { en: 'How much the satellite geometry amplifies range error into position error; lower is better, and satellites spread across the sky give low DOP.', ko: '위성 배치가 거리 오차를 위치 오차로 얼마나 증폭하는지의 척도. 낮을수록 좋고, 하늘 전체에 퍼진 위성일수록 낮다.' } },
    { id: 'a-gps', label: { en: 'assisted GPS', ko: '보조 GPS(A-GPS)' }, definition: { en: 'Getting satellite orbits, time and a rough position over the network so the receiver locks on in seconds instead of minutes.', ko: '위성 궤도·시각·개략 위치를 네트워크로 받아 수신기가 몇 분이 아니라 몇 초 만에 잠금하도록 하는 기법.' } },
    { id: 'relativity', label: { en: 'relativity', ko: '상대성이론' }, definition: { en: 'Einstein’s finding that clocks tick at different rates depending on speed and gravity; GPS satellite clocks are pre-corrected for it.', ko: '속도와 중력에 따라 시계가 다른 빠르기로 간다는 아인슈타인의 발견. GPS 위성 시계는 이를 미리 보정한다.' } },
  ],
  blocks: [
    // ---------- The trick in one sentence ----------
    { id: 's-trick', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'The trick in one sentence', ko: '핵심을 한 문장으로' } },
    {
      id: 'trick-novice', kind: 'para', levels: ['novice'], priority: 1, section: 's-trick',
      text: {
        en: 'Here is the whole idea. Far above you, about thirty satellites do nothing but shout the time, all day, as precisely as any clock on Earth. Your phone listens. Because radio travels at the speed of light, each announcement arrives a tiny bit late, and *how* late tells your phone how far away that satellite is. Hear a few satellites at once, and there is only one place on the planet where all those distances make sense together. That place is you. Your phone never talks back; it only listens, and it does the arithmetic itself, dozens of times a second, in the time it takes you to glance at the map. Everything else in this article is a footnote to that one trick.',
        ko: '전체 아이디어는 이렇습니다. 머리 위 아주 높은 곳에서 약 서른 개의 위성이 하루 종일 하는 일은 단 하나, 지구의 어떤 시계 못지않게 정확하게 시간을 외치는 것입니다. 휴대폰은 그 소리를 듣습니다. 전파는 빛의 속도로 오기 때문에 방송 하나하나가 아주 조금 늦게 도착하고, *얼마나* 늦었는지가 그 위성이 얼마나 멀리 있는지를 알려 줍니다. 위성 몇 개를 동시에 들으면, 그 거리들이 모두 동시에 말이 되는 지점은 지구상에 단 한 곳뿐입니다. 그곳이 바로 당신입니다. 휴대폰은 결코 대답하지 않습니다. 듣기만 하고, 계산은 스스로 합니다. 당신이 지도를 흘끗 보는 사이에 1초에 수십 번씩 말이죠. 이 글의 나머지는 모두 그 한 가지 요령에 달린 각주입니다.',
      },
    },
    {
      id: 'trick-main', kind: 'para', levels: ['intermediate', 'expert'], priority: 1, section: 's-trick',
      text: {
        en: 'A GPS satellite is a broadcast atomic clock with a known orbit. Every satellite continuously transmits its precise time and its position. Your receiver compares the transmitted time with its own clock to get a signal travel time, multiplies by the speed of light, and gets a distance, one per satellite. Three distances would fix a point in space, but your receiver’s clock is cheap and wrong by an unknown amount, so a fourth satellite supplies a fourth equation and the phone solves for its clock error along with its position. Everything else, from assisted GPS to relativity corrections, exists to make those timings honest.',
        ko: 'GPS 위성은 궤도가 알려진, 방송하는 원자시계입니다. 모든 위성은 자신의 정밀한 시각과 위치를 끊임없이 송신합니다. 수신기는 송신된 시각을 자기 시계와 비교해 신호의 이동 시간을 얻고, 여기에 빛의 속도를 곱해 위성마다 하나씩 거리를 구합니다. 거리 세 개면 공간의 한 점이 정해지겠지만, 수신기의 시계는 값싸고 미지의 양만큼 틀려 있으므로 네 번째 위성이 네 번째 방정식을 제공하고, 휴대폰은 위치와 함께 자기 시계 오차까지 풀어냅니다. 보조 GPS부터 상대성이론 보정까지 나머지 모든 것은 그 시각 측정을 정직하게 만들기 위해 존재합니다.',
      },
    },
    {
      id: 'quote-frame', kind: 'quote', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 's-trick',
      text: {
        en: 'GPS is not a map in the sky. It is a very expensive clock in the sky, and a cheap phone on the ground doing careful arithmetic about how late each message arrived.',
        ko: 'GPS는 하늘의 지도가 아닙니다. 하늘에 있는 아주 비싼 시계이고, 땅 위의 값싼 휴대폰이 각 메시지가 얼마나 늦게 도착했는지를 꼼꼼히 계산하는 일입니다.',
      },
    },

    // ---------- Measuring distance with time ----------
    { id: 's-distance', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Measuring distance with time', ko: '시간으로 거리를 재는 법' } },
    {
      id: 'distance-novice', kind: 'para', levels: ['novice'], priority: 2, section: 's-distance', teaches: ['speed-of-light'],
      text: {
        en: 'You already know the trick from thunderstorms: see the flash, count the seconds until the thunder, and every three seconds is about a kilometre. Radio cannot be counted by hand: it moves at the speed of light, about 300,000 kilometres every second, so a satellite’s announcement takes only about seven hundredths of a second to fall from its orbit 20,000 kilometres up. Your phone cannot count that on its fingers, but it can measure it electronically, and it measures it well: in one millionth of a second, light moves about 300 metres, so the timing has to be that good to place you on the right street. That is why the satellites must be so exact about the time: a sloppy clock up there puts you on the wrong street down here.',
        ko: '천둥번개에서 이미 아는 요령입니다. 번쩍임을 보고 천둥소리가 올 때까지 초를 세면, 3초마다 약 1킬로미터입니다. 전파는 손으로 셀 수 없습니다. 빛의 속도, 즉 매초 약 30만 킬로미터로 움직이므로, 위성의 방송이 2만 킬로미터 상공의 궤도에서 내려오는 데는 100분의 7초 정도밖에 걸리지 않습니다. 휴대폰은 그것을 손가락으로 셀 수는 없지만 전자적으로 잴 수 있고, 아주 잘 잽니다. 100만분의 1초 동안 빛은 약 300미터를 움직이므로, 당신을 올바른 길 위에 올려놓으려면 시각 측정이 그만큼 정밀해야 합니다. 위성이 시각에 그토록 정확해야 하는 이유입니다. 저 위의 시계가 엉성하면 이 아래의 당신은 엉뚱한 길 위에 놓입니다.',
      },
    },
    {
      id: 'distance-intermediate', kind: 'para', levels: ['intermediate'], priority: 2, section: 's-distance', teaches: ['speed-of-light'],
      text: {
        en: 'GPS satellites orbit at roughly 20,200 km, so their signals reach you after about 67 milliseconds. The receiver records when a signal arrives, reads the transmit time embedded in it, and computes distance = c × (arrival − transmit), with c ≈ 299,792 km/s. The conversion rates are unforgiving: 1 microsecond of timing error is about 300 metres of distance; 1 nanosecond is about 30 centimetres. Consumer receivers time the signal to within tens of nanoseconds by locking onto a known code pattern the satellite repeats every millisecond, then refining the alignment to a small fraction of one code chip.',
        ko: 'GPS 위성은 약 20,200km 고도를 돌기 때문에 신호는 약 67밀리초 뒤에 당신에게 도착합니다. 수신기는 신호가 도착한 시각을 기록하고, 신호에 담긴 송신 시각을 읽은 뒤, 거리 = c × (도착 − 송신)을 계산합니다. 여기서 c ≈ 299,792km/s입니다. 환산 비율은 가차 없습니다. 시각 오차 1마이크로초는 거리 약 300미터이고, 1나노초는 약 30센티미터입니다. 소비자용 수신기는 위성이 1밀리초마다 반복하는 알려진 부호 패턴에 동기를 맞춘 뒤, 정렬을 부호 칩 하나의 작은 분수 단위까지 다듬어 수십 나노초 이내로 신호 시각을 잽니다.',
      },
    },
    {
      id: 'distance-expert', kind: 'para', levels: ['expert'], priority: 2, section: 's-distance', teaches: ['speed-of-light', 'pseudorange'],
      text: {
        en: 'What a receiver actually measures is a **pseudorange**: ρ = c·(t_rx − t_tx), where t_tx comes from the satellite’s atomic clock and t_rx from the receiver’s own clock. Because the receiver clock has an unknown bias b, ρ = r + c·b + ε, where r is the true geometric range and ε collects atmospheric delay, multipath and noise. Satellite positions come from the broadcast ephemeris, valid for a few hours. On the L1 carrier (1575.42 MHz) the civilian C/A code repeats every millisecond with 1,023 chips, so one chip spans about 293 m; tracking loops resolve alignment to a small fraction of a chip, and carrier-phase techniques go far below that.',
        ko: '수신기가 실제로 재는 것은 **의사거리(pseudorange)**입니다. ρ = c·(t_rx − t_tx)로, t_tx는 위성의 원자시계에서, t_rx는 수신기 자체의 시계에서 옵니다. 수신기 시계에는 미지의 편차 b가 있으므로 ρ = r + c·b + ε이며, 여기서 r은 실제 기하학적 거리이고 ε은 대기 지연, 다중경로, 잡음을 한데 모은 항입니다. 위성 위치는 몇 시간 동안 유효한 방송 궤도력(ephemeris)에서 얻습니다. L1 반송파(1575.42MHz)에서 민간용 C/A 부호는 1,023개의 칩으로 1밀리초마다 반복되므로 칩 하나는 약 293m에 해당합니다. 추적 루프는 정렬을 칩의 작은 분수 단위까지 분해하고, 반송파 위상 기법은 그보다 훨씬 아래까지 내려갑니다.',
      },
    },
    {
      id: 'code-ns-to-m', kind: 'code', levels: ['intermediate', 'expert'], priority: 4, section: 's-distance', requires: ['speed-of-light'], goals: ['build'],
      text: { en: CODE_EN, ko: CODE_KO },
    },

    // ---------- Three circles and a fourth satellite ----------
    { id: 's-circles', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Three circles and a fourth satellite', ko: '원 세 개와 네 번째 위성' } },
    {
      id: 'circles-novice', kind: 'para', levels: ['novice'], priority: 1, section: 's-circles', teaches: ['trilateration'], simplerOf: 'circles-intermediate',
      text: {
        en: 'Imagine three lighthouses, each shouting “I am exactly this far from you.” One lighthouse alone gives you a circle of possible places. Two give you two circles that cross at two spots. Three cross at exactly one spot, and that spot is you. Satellites do the same in three dimensions: each distance is a sphere, and the spheres meet where your phone is. But there is a catch. Your phone’s clock is a cheap quartz crystal, not an atomic clock, so every distance it measures is off by the same unknown amount. Listening to a fourth satellite lets the phone find that mistake and cancel it. Four is the magic number. It also explains why your phone struggles with a view of only two or three satellites: the circles simply do not close.',
        ko: '등대 세 개가 각각 “나는 당신에게서 정확히 이만큼 떨어져 있다”고 외친다고 상상해 보세요. 등대 하나만으로는 가능한 위치가 원 하나입니다. 둘이면 두 점에서 만나는 원 두 개가 생깁니다. 셋이면 정확히 한 점에서 만나고, 그 점이 바로 당신입니다. 위성도 3차원에서 같은 일을 합니다. 거리 하나하나가 구(球)이고, 그 구들은 휴대폰이 있는 곳에서 만납니다. 그런데 함정이 하나 있습니다. 휴대폰의 시계는 원자시계가 아니라 값싼 수정 진동자라서, 휴대폰이 재는 모든 거리가 똑같은 미지의 양만큼 틀려 있습니다. 네 번째 위성을 들으면 휴대폰은 그 실수를 찾아내 지워 버릴 수 있습니다. 넷이 마법의 숫자입니다. 위성이 두세 개만 보일 때 휴대폰이 애를 먹는 이유도 이것으로 설명됩니다. 원들이 그냥 닫히지 않는 것입니다.',
      },
    },
    {
      id: 'circles-intermediate', kind: 'para', levels: ['intermediate'], priority: 1, section: 's-circles', teaches: ['trilateration', 'clock-bias'],
      text: {
        en: 'Each measured distance puts you on a sphere centred on that satellite. Two spheres intersect in a circle; a third sphere cuts that circle at two points, one of which is usually far out in space or moving absurdly fast and is discarded. That is trilateration (not triangulation: no angles are measured). The fourth satellite is needed because your receiver’s clock offset shifts *every* distance by the same amount, and one extra measurement lets the solver treat that offset as a fourth unknown. Modern receivers track eight to thirty satellites across several constellations and solve the over-determined system by least squares, which also smooths noise and flags bad signals.',
        ko: '측정된 거리 하나하나는 당신을 그 위성을 중심으로 한 구면 위에 놓습니다. 구 두 개는 원에서 만나고, 세 번째 구는 그 원을 두 점에서 자릅니다. 둘 중 하나는 보통 우주 저 멀리 있거나 터무니없이 빠르게 움직이므로 버려집니다. 이것이 삼변측량(trilateration)입니다(각도를 재지 않으므로 삼각측량이 아닙니다). 네 번째 위성이 필요한 까닭은 수신기 시계의 오프셋이 *모든* 거리를 같은 양만큼 밀어내기 때문이며, 측정값 하나가 더 있으면 풀이기가 그 오프셋을 네 번째 미지수로 다룰 수 있습니다. 현대 수신기는 여러 위성군에 걸쳐 8~30개 위성을 추적하고, 과결정 시스템을 최소제곱법으로 풀어 잡음도 다듬고 불량 신호도 골라냅니다.',
      },
    },
    {
      id: 'circles-expert', kind: 'para', levels: ['expert'], priority: 1, section: 's-circles', teaches: ['trilateration', 'clock-bias'], requires: ['pseudorange'],
      text: {
        en: 'The navigation solution has four unknowns: receiver position (x, y, z) and clock bias b. Each satellite i contributes one equation ρᵢ = ‖sᵢ − x‖ + c·b + εᵢ, with sᵢ from the ephemeris. Four satellites make the system square; more make it over-determined, and receivers linearise about a guess and iterate a weighted least-squares (or Kalman) solution, weighting by elevation and signal quality. The by-product is a receiver time accurate to tens of nanoseconds, which is why a phone with a clear sky view is also an excellent clock. Geometry matters: if the satellites cluster in one part of the sky, the equations become nearly parallel and small range errors blow up into large position errors.',
        ko: '항법 해에는 미지수가 넷 있습니다. 수신기 위치 (x, y, z)와 시계 편차 b입니다. 위성 i마다 방정식 하나, ρᵢ = ‖sᵢ − x‖ + c·b + εᵢ가 더해지며 sᵢ는 궤도력에서 옵니다. 위성 넷이면 방정식이 정방이 되고, 더 많으면 과결정이 됩니다. 수신기는 추정값 주위에서 선형화한 뒤 고도각과 신호 품질로 가중치를 준 가중 최소제곱(또는 칼만 필터) 해를 반복해서 구합니다. 그 부산물로 수십 나노초 정확도의 수신기 시각이 나오는데, 하늘이 잘 보이는 휴대폰이 훌륭한 시계이기도 한 이유입니다. 기하 배치도 중요합니다. 위성들이 하늘의 한쪽에 몰려 있으면 방정식들이 거의 평행해져서 작은 거리 오차가 큰 위치 오차로 부풀어 오릅니다.',
      },
    },
    {
      id: 'figure-circles', kind: 'figure', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 's-circles', requires: ['trilateration'], figure: 'circles',
      text: {
        en: 'Figure: each dashed circle is every point exactly one measured distance from a satellite. Two circles still leave two possible spots; only one point lies on all three at once. In three dimensions the circles are spheres, and the idea is identical.',
        ko: '그림: 점선 원 하나하나는 한 위성에서 측정된 거리만큼 정확히 떨어진 모든 점입니다. 원 둘로는 여전히 가능한 지점이 둘 남지만, 세 원 모두에 동시에 놓이는 점은 단 하나입니다. 3차원에서는 원이 구가 될 뿐, 아이디어는 똑같습니다.',
      },
    },
    {
      id: 'interactive-trilateration', kind: 'interactive', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 's-circles', requires: ['trilateration'], interactive: 'trilateration',
      text: {
        en: 'Try it. The map shows satellites around a receiver. Drag the clock-error slider, or ask your agent to set it: every nanosecond of receiver clock error becomes about 30 centimetres of range error on *every* satellite at once. With four satellites the solver cancels it and the fix snaps back; with only three, the error leaks straight into the position. Turn on reflections to see what a city does: one satellite’s signal arrives late after bouncing off a building, and the fix drifts in that direction. Nothing here is simulated by a model; it is the same geometry your phone solves, drawn slowly.',
        ko: '직접 해 보세요. 지도에는 수신기 주변의 위성들이 보입니다. 시계 오차 슬라이더를 끌어 보거나 에이전트에게 설정해 달라고 하세요. 수신기 시계 오차 1나노초는 *모든* 위성에 동시에 약 30센티미터의 거리 오차가 됩니다. 위성이 넷이면 풀이기가 그 오차를 지워 위치가 제자리로 돌아오지만, 셋뿐이면 오차가 그대로 위치로 새어 들어갑니다. 반사를 켜면 도시에서 무슨 일이 일어나는지 볼 수 있습니다. 한 위성의 신호가 건물에 튕겨 늦게 도착하고, 위치는 그 방향으로 밀려납니다. 여기서 모형이 흉내 내는 것은 아무것도 없습니다. 휴대폰이 푸는 것과 똑같은 기하를 천천히 그려 보인 것뿐입니다.',
      },
    },

    // ---------- Why the clocks are the whole story ----------
    { id: 's-clocks', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Why the clocks are the whole story', ko: '결국 시계가 전부인 이유' } },
    {
      id: 'clocks-novice', kind: 'para', levels: ['novice'], priority: 2, section: 's-clocks', teaches: ['atomic-clock'],
      text: {
        en: 'Everything depends on the satellites telling the truth about the time, so each one carries several atomic clocks. An atomic clock keeps time by counting the steady vibration of atoms, and it drifts by only billionths of a second per day. Your phone’s clock, by contrast, wanders by whole microseconds, and a microsecond is 300 metres. That is exactly why the fourth satellite matters: rather than trusting its own clock, the phone treats its clock error as one more thing to figure out. Once it has, your phone knows the time about as well as the satellites do. Which is a strange and lovely fact: the cheapest phone, with a clear view of the sky, becomes a better clock than anything else in your house.',
        ko: '모든 것은 위성이 시간에 대해 진실을 말하는 데 달려 있어서, 위성마다 원자시계를 여러 개 싣고 있습니다. 원자시계는 원자의 일정한 진동을 세어 시간을 지키며, 하루에 10억분의 몇 초만 어긋납니다. 반면 휴대폰의 시계는 마이크로초 단위로 헤매고, 1마이크로초는 300미터입니다. 네 번째 위성이 중요한 이유가 바로 이것입니다. 휴대폰은 자기 시계를 믿는 대신, 시계 오차를 알아내야 할 것 하나로 더 취급합니다. 그렇게 하고 나면 휴대폰은 위성만큼이나 정확하게 시간을 알게 됩니다. 묘하고도 아름다운 사실입니다. 가장 값싼 휴대폰도 하늘이 트여 있으면 집 안의 그 어떤 것보다 좋은 시계가 됩니다.',
      },
    },
    {
      id: 'clocks-main', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 's-clocks', teaches: ['atomic-clock', 'clock-bias'],
      text: {
        en: 'Each satellite carries rubidium or caesium atomic clocks, stable to a few nanoseconds per day, and ground stations continuously measure every clock and broadcast tiny corrections alongside the orbit data. The receiver’s crystal oscillator is millions of times worse and drifts with temperature, which is why the receiver never trusts it: the clock bias is solved fresh with every fix, so the timing is effectively borrowed from the satellites. This has a happy side effect. A GPS receiver is the cheapest way to get atomic-clock time anywhere on Earth, and mobile networks, power grids and financial exchanges quietly depend on it.',
        ko: '위성마다 루비듐 또는 세슘 원자시계를 싣고 있는데, 하루에 몇 나노초 수준으로 안정적이며, 지상국이 모든 시계를 끊임없이 측정해 궤도 정보와 함께 미세한 보정값을 방송합니다. 수신기의 수정 발진기는 수백만 배 나쁘고 온도에 따라 흔들리기도 해서, 수신기는 결코 그것을 믿지 않습니다. 시계 편차는 위치를 구할 때마다 새로 풀리므로, 시각은 사실상 위성에서 빌려 오는 셈입니다. 여기에는 반가운 부수 효과가 있습니다. GPS 수신기는 지구 어디서든 원자시계 시각을 얻는 가장 싼 방법이고, 이동통신망, 전력망, 금융 거래소가 조용히 여기에 의존하고 있습니다.',
      },
    },
    {
      id: 'relativity-main', kind: 'para', levels: ['intermediate', 'expert'], priority: 3, section: 's-clocks', teaches: ['relativity'],
      text: {
        en: 'The clocks are so good that Einstein becomes an engineering requirement. Special relativity says a clock moving at the satellites’ 3.9 km/s runs slow, by about 7 microseconds per day. General relativity says a clock in weaker gravity, 20,200 km up, runs fast, by about 45 microseconds per day. The net effect is that satellite clocks gain about 38 microseconds a day relative to yours. Left uncorrected, that alone would push positions off by around 11 kilometres per day. So the clocks are deliberately tuned before launch to tick slightly slow, at 10.22999999543 MHz instead of 10.23 MHz, and arrive in orbit ticking at the right rate as seen from the ground.',
        ko: '시계가 너무 좋다 보니 아인슈타인이 공학적 요구사항이 됩니다. 특수상대성이론에 따르면 위성 속도인 초속 3.9km로 움직이는 시계는 하루에 약 7마이크로초 느리게 갑니다. 일반상대성이론에 따르면 20,200km 상공의 더 약한 중력 속 시계는 하루에 약 45마이크로초 빠르게 갑니다. 합치면 위성 시계는 당신의 시계보다 하루에 약 38마이크로초씩 앞서 갑니다. 이것만 보정하지 않아도 위치가 하루에 약 11킬로미터씩 어긋납니다. 그래서 시계는 발사 전에 10.23MHz 대신 10.22999999543MHz로 일부러 약간 느리게 맞춰지고, 궤도에 올라가면 지상에서 보기에 정확한 속도로 째깍거리게 됩니다.',
      },
    },
    {
      id: 'relativity-novice', kind: 'para', levels: ['novice'], priority: 3, section: 's-clocks', teaches: ['relativity'], simplerOf: 'relativity-main',
      text: {
        en: 'Here is a fact that sounds like science fiction and is simply true: time runs at slightly different speeds in orbit. Moving fast makes a clock tick a little slower; being farther from Earth’s gravity makes it tick a little faster. For the satellites, the second effect wins, and their clocks gain about 38 millionths of a second every day compared with a clock on the ground. That sounds like nothing, but light covers 11 kilometres in that time, so an uncorrected GPS would be useless within a day. Engineers set the satellite clocks slightly slow before launch so that, seen from the ground, they tick exactly right. It is probably the only place in everyday life where relativity is not a curiosity but a maintenance item.',
        ko: '공상과학처럼 들리지만 그냥 사실인 이야기 하나. 궤도에서는 시간이 약간 다른 빠르기로 흐릅니다. 빨리 움직이면 시계가 조금 느리게 가고, 지구 중력에서 멀어지면 조금 빠르게 갑니다. 위성의 경우 두 번째 효과가 이기고, 위성의 시계는 지상의 시계에 비해 매일 약 100만분의 38초씩 앞서 갑니다. 아무것도 아닌 것 같지만 빛은 그 시간 동안 11킬로미터를 가므로, 보정하지 않은 GPS는 하루 안에 쓸모없어집니다. 엔지니어들은 지상에서 보기에 정확히 맞게 째깍거리도록, 발사 전에 위성 시계를 약간 느리게 맞춰 둡니다. 아마도 일상에서 상대성이론이 호기심거리가 아니라 정비 항목인 유일한 곳일 겁니다.',
      },
    },
    {
      id: 'aside-time-source', kind: 'aside', levels: ['novice', 'intermediate', 'expert'], priority: 3, section: 's-clocks',
      text: {
        en: '**Aside: the clock nobody notices.** Because a receiver solves for time as well as place, GPS quietly became the world’s shared clock. Cell towers use it to keep their radio slots aligned, electricity grids use it to timestamp faults across a continent, and stock exchanges use it to order trades. When you ask where you are, you are also asking what time it is, to a few tens of nanoseconds. A single satellite is enough for time if the receiver already knows where it is, which is why the rooftop antennas at data centres look nothing like a phone.',
        ko: '**여담: 아무도 눈치채지 못하는 시계.** 수신기가 위치와 함께 시각도 풀어내기 때문에, GPS는 조용히 전 세계의 공용 시계가 되었습니다. 기지국은 무선 슬롯을 맞추는 데, 전력망은 대륙 너머의 고장 시각을 기록하는 데, 증권거래소는 거래 순서를 매기는 데 GPS를 씁니다. 당신이 어디 있는지 물을 때, 당신은 지금이 몇 시인지도 수십 나노초 단위로 묻고 있는 셈입니다. 수신기가 자기 위치를 이미 알고 있다면 시각을 얻는 데는 위성 하나면 충분하며, 데이터센터 옥상의 안테나가 휴대폰과 전혀 다르게 생긴 이유가 이것입니다.',
      },
    },

    // ---------- Why cities and buildings confuse it ----------
    { id: 's-cities', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Why cities and buildings confuse it', ko: '도시와 건물이 헷갈리게 하는 이유' } },
    {
      id: 'cities-novice', kind: 'para', levels: ['novice'], priority: 3, section: 's-cities', teaches: ['multipath'], simplerOf: 'cities-main',
      text: {
        en: 'In an open field your phone usually knows where you are to within a few metres. Between tall buildings it can put you on the wrong side of the street, and the reason is echoes. A satellite’s signal can bounce off a glass tower before reaching you, so it arrives late, and late means far: your phone believes that satellite is farther away than it is and nudges your dot in the wrong direction. Add in that buildings hide half the sky, leaving only satellites bunched overhead, which is the worst arrangement for pinning down a point, and you get the familiar jumping blue dot. Newer phones cope better by ignoring signals that look reflected and by listening to more satellites, but no receiver can hear a satellite the building is hiding.',
        ko: '탁 트인 들판에서 휴대폰은 보통 몇 미터 이내로 당신의 위치를 압니다. 높은 건물 사이에서는 길 반대편에 당신을 올려놓기도 하는데, 그 이유는 메아리입니다. 위성 신호가 당신에게 닿기 전에 유리 건물에 튕길 수 있고, 그러면 늦게 도착합니다. 늦다는 것은 멀다는 뜻이므로 휴대폰은 그 위성이 실제보다 멀리 있다고 믿고 당신의 점을 엉뚱한 방향으로 밀어 버립니다. 게다가 건물이 하늘의 절반을 가려 머리 위에 몰린 위성만 남는데, 이것은 한 점을 못 박기에 최악의 배치입니다. 그래서 낯익은 통통 튀는 파란 점이 나옵니다. 최신 휴대폰은 반사된 것으로 보이는 신호를 무시하고 더 많은 위성을 들어 더 잘 대처하지만, 건물이 가리고 있는 위성을 들을 수 있는 수신기는 없습니다.',
      },
    },
    {
      id: 'cities-main', kind: 'para', levels: ['intermediate', 'expert'], priority: 3, section: 's-cities', teaches: ['multipath', 'ionosphere', 'dop'],
      text: {
        en: 'Three effects dominate the error budget. **Ionosphere**: free electrons delay the signal by an amount that scales with 1/f², so dual-frequency receivers (L1 + L5, common in phones since 2018) can cancel most of it, while single-frequency ones rely on a broadcast model. **Multipath**: a reflected copy arrives after the direct path and pulls the timing late; in street canyons it can add tens of metres. **Geometry**: the dilution of precision (DOP) multiplies range error into position error, and satellites clustered overhead or on one side give a high DOP. A good fix needs satellites spread across the sky, a clean line of sight, and a receiver that discounts the reflections.',
        ko: '오차 예산을 좌우하는 효과는 셋입니다. **전리층**: 자유 전자가 신호를 지연시키는데 그 양은 1/f²에 비례하므로, 이중 주파수 수신기(L1 + L5, 2018년 이후 휴대폰에 흔함)는 대부분을 상쇄할 수 있고, 단일 주파수 수신기는 방송되는 모형에 의존합니다. **다중경로**: 반사된 복사본이 직접 경로보다 늦게 도착해 시각을 늦추며, 빌딩 협곡에서는 수십 미터가 더해질 수 있습니다. **기하 배치**: 정밀도 저하율(DOP)이 거리 오차를 위치 오차로 증폭하는데, 위성들이 머리 위나 한쪽에 몰리면 DOP가 높아집니다. 좋은 측위에는 하늘 전체에 퍼진 위성, 깨끗한 가시선, 그리고 반사를 걸러내는 수신기가 필요합니다.',
      },
    },

    // ---------- Your phone cheats, helpfully ----------
    { id: 's-cheats', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Your phone cheats, helpfully', ko: '휴대폰은 (고맙게도) 편법을 쓴다' } },
    {
      id: 'cheats-novice', kind: 'para', levels: ['novice'], priority: 2, section: 's-cheats', teaches: ['a-gps'],
      text: {
        en: 'Old GPS receivers took minutes to find themselves, because they had to wait for each satellite to slowly announce where it was in the sky. Your phone skips the wait: it downloads the satellites’ positions over the internet in a second, then knows exactly which signals to look for. That is assisted GPS. Indoors, where satellite signals are too weak to hear, the phone guesses from the Wi-Fi networks and cell towers around it, matching their names against huge maps of where those networks have been seen before. In a tunnel, it even keeps counting your steps and turns until the sky comes back. The blue dot you see is a blend of all of these, weighted by how much the phone trusts each one at that moment.',
        ko: '옛날 GPS 수신기는 자기 위치를 찾는 데 몇 분씩 걸렸습니다. 위성 하나하나가 하늘 어디에 있는지 느릿느릿 알려 줄 때까지 기다려야 했기 때문입니다. 휴대폰은 그 기다림을 건너뜁니다. 인터넷으로 1초 만에 위성들의 위치를 내려받고, 어떤 신호를 찾아야 하는지 정확히 알게 됩니다. 이것이 보조 GPS입니다. 위성 신호가 너무 약해 들리지 않는 실내에서는, 주변 와이파이와 기지국의 이름을 그 네트워크들이 이전에 목격된 위치를 담은 거대한 지도와 맞춰 보며 추측합니다. 터널에서는 하늘이 다시 보일 때까지 당신의 걸음과 회전을 세어 가며 버티기도 합니다. 당신이 보는 파란 점은 이 모든 것을 섞은 것이며, 그 순간 휴대폰이 각각을 얼마나 믿느냐에 따라 가중치가 달라집니다.',
      },
    },
    {
      id: 'cheats-main', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 's-cheats', teaches: ['a-gps'],
      text: {
        en: 'A cold-start receiver must decode the navigation message, broadcast at only 50 bits per second: about 30 seconds for one satellite’s ephemeris and 12.5 minutes for the full almanac. Assisted GPS fetches ephemeris, almanac, rough time and a coarse position over the data network instead, so the receiver knows which satellites to search and roughly what Doppler shift to expect, cutting time-to-first-fix to seconds. Where the sky is unavailable, the phone falls back to Wi-Fi and cell-tower positioning against crowdsourced databases, and fuses accelerometer, gyroscope and barometer data to dead-reckon through tunnels and to tell which floor you are on. The blue dot is a committee decision.',
        ko: '콜드 스타트 상태의 수신기는 초당 겨우 50비트로 방송되는 항법 메시지를 해독해야 합니다. 위성 하나의 궤도력에 약 30초, 전체 알마낙에 12.5분이 걸립니다. 보조 GPS는 궤도력, 알마낙, 대략의 시각과 개략 위치를 대신 데이터망으로 받아 오므로, 수신기는 어떤 위성을 찾을지와 대략 어떤 도플러 편이를 예상할지 알게 되어 첫 측위까지의 시간이 몇 초로 줄어듭니다. 하늘을 볼 수 없는 곳에서는 휴대폰이 크라우드소싱 데이터베이스를 상대로 한 와이파이·기지국 측위로 물러나고, 가속도계·자이로스코프·기압계 데이터를 융합해 터널을 추측항법으로 통과하고 몇 층에 있는지도 알아냅니다. 파란 점은 위원회의 결정입니다.',
      },
    },
    {
      id: 'aside-constellations', kind: 'aside', levels: ['novice', 'intermediate', 'expert'], priority: 4, section: 's-cheats',
      text: {
        en: '**Aside: it is not just GPS.** GPS is the American system. Russia runs GLONASS, the European Union runs Galileo, China runs BeiDou, and Japan and India run regional add-ons. The umbrella term is GNSS. A modern phone listens to several at once, which roughly doubles the satellites in view, fills gaps between buildings, and improves the geometry that decides how sharp your fix can be. Each system uses its own time scale and clocks, so a receiver mixing them solves for one extra offset per system, a small price for the extra satellites.',
        ko: '**여담: GPS만 있는 게 아닙니다.** GPS는 미국의 시스템입니다. 러시아는 GLONASS를, 유럽연합은 Galileo를, 중국은 BeiDou를 운영하고, 일본과 인도는 지역 보강 시스템을 운영합니다. 이를 아우르는 용어가 GNSS입니다. 현대 휴대폰은 여러 시스템을 동시에 들으며, 이렇게 하면 보이는 위성이 대략 두 배로 늘고, 건물 사이의 빈틈이 메워지며, 측위가 얼마나 정밀할 수 있는지를 결정하는 기하 배치가 좋아집니다. 각 시스템은 자체 시간 척도와 시계를 쓰므로, 이를 섞어 쓰는 수신기는 시스템마다 오프셋을 하나씩 더 풀어야 합니다. 위성이 늘어나는 대가로는 작은 값입니다.',
      },
    },

    // ---------- Who can see where you are ----------
    { id: 's-privacy', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: { en: 'Who can see where you are', ko: '누가 내 위치를 볼 수 있나' } },
    {
      id: 'privacy', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 's-privacy', goals: ['decide'],
      text: {
        en: 'The satellites cannot see you. GPS is one-way: satellites broadcast like radio stations, nothing travels from your phone up to them, and no operator knows who is listening. Your position is computed inside the phone. Where location leaks is everything *after* that. First, app permissions: precise versus approximate, while-using versus always. Second, network positioning, which uploads the identifiers of nearby Wi-Fi networks and cell towers to a provider to ask “where is this?”, an implicit disclosure even with GPS off. Third, your carrier, which can always place a connected phone roughly from the towers serving it. If you want to be unfindable, airplane mode does more than the location toggle; if you merely want fewer trackers, permissions are where the leverage is.',
        ko: '위성은 당신을 볼 수 없습니다. GPS는 단방향입니다. 위성은 라디오 방송국처럼 방송만 하고, 휴대폰에서 위성으로 올라가는 것은 아무것도 없으며, 어떤 운영자도 누가 듣는지 모릅니다. 당신의 위치는 휴대폰 안에서 계산됩니다. 위치가 새는 곳은 그 *다음*의 모든 것입니다. 첫째, 앱 권한. 정확한 위치 대 대략적 위치, 사용 중에만 대 항상. 둘째, 네트워크 측위. 근처 와이파이와 기지국의 식별자를 제공업체에 올려 “여기가 어디죠?”라고 묻는 것으로, GPS를 꺼도 암묵적인 공개입니다. 셋째, 통신사. 접속 중인 휴대폰을 서비스하는 기지국으로 언제나 대략 위치를 잡을 수 있습니다. 찾히지 않기를 원한다면 위치 토글보다 비행기 모드가 더 많은 일을 하고, 그저 추적자를 줄이고 싶다면 권한이 지렛대입니다.',
      },
    },
  ],
  faq: [
    {
      id: 'needs-internet',
      keywords: ['internet', 'data', 'offline', 'wifi', 'wi-fi', 'connection', '인터넷', '데이터', '오프라인', '와이파이', '연결'],
      question: { en: 'Does GPS need an internet connection?', ko: 'GPS는 인터넷 연결이 필요한가요?' },
      answer: {
        en: 'No. The satellite signals are free to receive, and a phone can compute a position with no network at all; it just starts more slowly, up to a minute or more, because it has to download orbit data from the satellites themselves. Data helps in two ways: assisted GPS fetches that orbit data instantly, and map tiles have to come from somewhere.',
        ko: '아니요. 위성 신호는 무료로 수신할 수 있고, 휴대폰은 네트워크가 전혀 없어도 위치를 계산할 수 있습니다. 다만 위성에서 직접 궤도 데이터를 내려받아야 하므로 시작이 1분 이상 걸릴 만큼 느려집니다. 데이터는 두 가지로 도움이 됩니다. 보조 GPS가 그 궤도 데이터를 즉시 받아 오고, 지도 타일도 어딘가에서 와야 하니까요.',
      },
    },
    {
      id: 'indoors',
      keywords: ['indoor', 'indoors', 'inside', 'building', 'mall', 'basement', '실내', '건물', '안에서', '지하'],
      question: { en: 'Why is my location wrong indoors?', ko: '실내에서는 왜 위치가 틀리나요?' },
      answer: {
        en: 'Satellite signals arrive extremely weak, below the background noise, and roofs and floors absorb them further. Indoors your phone mostly falls back to Wi-Fi and cell-tower matching, which is accurate to tens of metres at best. Near windows you may get a few satellites plus reflections, which can be worse than nothing.',
        ko: '위성 신호는 배경 잡음보다도 약하게 도착하고, 지붕과 바닥이 그것을 더 흡수합니다. 실내에서 휴대폰은 대부분 와이파이·기지국 대조로 물러나는데, 이는 잘해야 수십 미터 정확도입니다. 창가에서는 위성 몇 개와 반사파를 함께 받게 되어 오히려 없느니만 못할 수도 있습니다.',
      },
    },
    {
      id: 'tracked',
      keywords: ['track', 'tracking', 'satellite see', 'satellites see', 'spy', 'watch me', '추적', '감시', '위성이 나를'],
      question: { en: 'Can the satellites track my phone?', ko: '위성이 내 휴대폰을 추적할 수 있나요?' },
      answer: {
        en: 'No. GPS is one-way: satellites broadcast, receivers listen, and nothing goes back up. Tracking happens on the ground, through apps that read the position your phone computed and through networks that can see your phone.',
        ko: '아니요. GPS는 단방향입니다. 위성은 방송하고, 수신기는 듣고, 위로 올라가는 것은 없습니다. 추적은 지상에서 일어납니다. 휴대폰이 계산한 위치를 읽는 앱과, 휴대폰을 볼 수 있는 네트워크를 통해서입니다.',
      },
    },
    {
      id: 'slow-fix',
      keywords: ['slow', 'take so long', 'takes long', 'searching', 'first fix', 'cold start', '느려', '오래 걸', '찾는 데', '검색 중'],
      question: { en: 'Why does it sometimes take a while to find me?', ko: '왜 가끔 내 위치를 찾는 데 시간이 걸리나요?' },
      answer: {
        en: 'A cold receiver has to decode the satellites’ orbit messages at 50 bits per second before it can use them, about 30 seconds per satellite at best. Phones normally skip this with assisted GPS over the network; if the network is down, or the phone has been off for a long time, you feel the wait.',
        ko: '차가운 상태의 수신기는 위성의 궤도 메시지를 초당 50비트로 해독한 뒤에야 쓸 수 있는데, 잘해야 위성당 약 30초가 걸립니다. 휴대폰은 보통 네트워크를 통한 보조 GPS로 이 과정을 건너뜁니다. 네트워크가 끊겼거나 휴대폰이 오랫동안 꺼져 있었다면 그 기다림을 체감하게 됩니다.',
      },
    },
    {
      id: 'accuracy',
      keywords: ['accurate', 'accuracy', 'precise', 'precision', 'metres', 'meters', 'centimetre', 'centimeter', '정확', '오차', '몇 미터', '센티미터'],
      question: { en: 'How accurate is a phone’s GPS?', ko: '휴대폰 GPS는 얼마나 정확한가요?' },
      answer: {
        en: 'With a clear sky, a few metres. Dual-frequency phones under good conditions can approach a metre. In street canyons, tens of metres. Survey receivers reach centimetres by using carrier phase and correction networks, techniques phones are increasingly borrowing.',
        ko: '하늘이 트여 있으면 몇 미터입니다. 이중 주파수 휴대폰은 조건이 좋으면 1미터 가까이 갑니다. 빌딩 협곡에서는 수십 미터입니다. 측량용 수신기는 반송파 위상과 보정 네트워크로 센티미터 수준에 이르는데, 휴대폰도 점점 그 기법을 빌려 오고 있습니다.',
      },
    },
    {
      id: 'turn-off',
      keywords: ['turn off', 'switch off', 'disable', 'hide', 'invisible', 'airplane', 'privacy', '끄면', '꺼도', '숨길', '비행기 모드', '개인정보', '프라이버시'],
      question: { en: 'If I turn off location, am I invisible?', ko: '위치를 끄면 나는 보이지 않게 되나요?' },
      answer: {
        en: 'To apps, mostly yes. To your carrier, no: any connected phone can be coarse-located from cell towers. To Wi-Fi positioning providers, only if Wi-Fi scanning is off too. Airplane mode is the real off switch; the satellites were never the problem.',
        ko: '앱에게는 대체로 그렇습니다. 통신사에게는 아닙니다. 접속 중인 휴대폰은 기지국으로 대략 위치를 잡을 수 있습니다. 와이파이 측위 제공업체에게는 와이파이 스캔까지 꺼야 보이지 않습니다. 진짜 끄는 스위치는 비행기 모드이고, 위성은 애초에 문제였던 적이 없습니다.',
      },
    },
  ],
  figures: {
    circles: `<svg viewBox="0 0 1100 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Three dashed circles around three satellites intersect at one point, labelled you">
<rect width="1100" height="420" fill="#f6f3ec"/>
<circle cx="380" cy="150" r="184" fill="none" stroke="#1b1b1f" stroke-width="2" stroke-dasharray="6 6"/>
<circle cx="740" cy="140" r="206" fill="none" stroke="#1b1b1f" stroke-width="2" stroke-dasharray="6 6"/>
<circle cx="560" cy="330" r="110" fill="none" stroke="#1b1b1f" stroke-width="2" stroke-dasharray="6 6"/>
<line x1="380" y1="150" x2="550" y2="220" stroke="#1fa66a" stroke-width="2"/>
<line x1="740" y1="140" x2="550" y2="220" stroke="#1fa66a" stroke-width="2"/>
<line x1="560" y1="330" x2="550" y2="220" stroke="#1fa66a" stroke-width="2"/>
<rect x="368" y="138" width="24" height="24" fill="#1b1b1f"/>
<rect x="728" y="128" width="24" height="24" fill="#1b1b1f"/>
<rect x="548" y="318" width="24" height="24" fill="#1b1b1f"/>
<circle cx="550" cy="220" r="9" fill="#e8462b"/>
<text x="380" y="126" font-size="16" fill="#1b1b1f" text-anchor="middle">Satellite 1</text>
<text x="740" y="116" font-size="16" fill="#1b1b1f" text-anchor="middle">Satellite 2</text>
<text x="560" y="368" font-size="16" fill="#1b1b1f" text-anchor="middle">Satellite 3</text>
<text x="566" y="214" font-size="16" fill="#e8462b">you</text>
<text x="430" y="168" font-size="14" fill="#1fa66a" transform="rotate(22 430 168)">measured distance</text>
<text x="40" y="404" font-size="14" fill="#1b1b1f">Each dashed circle: every point exactly one measured distance from a satellite. Only one point is on all three.</text>
</svg>`,
  },
};
