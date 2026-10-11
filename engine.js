/* PM Interview Arena - case generator + heuristic scoring engine.
   Scores are keyword/structure heuristics, NOT expert or hiring assessments. */
(function (root) {
  'use strict';

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const int = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
  const norm = (s) => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

  /* ---------- reusable detector groups ---------- */

  const CLARIFY = {
    timing:   { label: 'Timing', q: 'Was it a sudden step-change or a gradual slide, and when exactly did it start?', re: /(when|since when|sudden|gradual|exact(ly)? (date|when)|started|step[- ]change|trend)/ },
    scope:    { label: 'Scope', q: 'Is it across all platforms/regions/segments, or concentrated somewhere?', re: /(all (platforms|segments|regions|users|countries)|only (on )?(ios|android|web|one)|specific (segment|region|platform|cohort)|which (segment|platform|region|cohort|users)|concentrated|across (the board|platforms|segments))/ },
    definition: { label: 'Metric definition', q: 'How is the metric defined, and did the definition or tracking change?', re: /(defin|calculat|how (do we|are we|is it) measur|what counts|tracking|instrument)/ },
    changes:  { label: 'Recent changes', q: 'What shipped, launched or changed (product, pricing, campaigns) around then?', re: /(release|launch|ship|change|experiment|campaign|deploy|rollout|promo)/ },
    baseline: { label: 'Baseline', q: 'What is normal here? Any seasonality or historical precedent?', re: /(baseline|normal|typical|historical|season|usual|precedent|benchmark|previous)/ },
    goal:     { label: 'Goal & constraints', q: 'What is the goal, the deadline and the resourcing constraint?', re: /(goal|objective|okr|priorit|deadline|timeline|budget|resource|constraint|capacity|team size|target)/ },
    user:     { label: 'Target user', q: 'Who exactly is the target user or customer?', re: /(who (is|are|exactly)|target (user|customer|segment)|persona|which (user|customer)|what (type|kind) of (user|customer))/ },
    strategy: { label: 'Strategic fit', q: 'Is this capability core to our differentiation?', re: /(core|differentiat|strategic|competitive advantage|moat)/ },
    scale:    { label: 'Scale', q: 'What scale or volume are we talking about?', re: /(scale|volume|how many|how much|usage|traffic|number of)/ },
    alternatives: { label: 'Alternatives', q: 'What are users or competitors doing today instead?', re: /(compet|alternative|today|currently|existing|incumbent|workaround)/ },
    success:  { label: 'Success criteria', q: 'How will we judge success?', re: /(success|measure|kpi|metric|win|good look)/ },
    legal:    { label: 'Regulatory / data', q: 'Are there regulatory, data or compliance constraints?', re: /(regulat|compliance|legal|privacy|licen|data law|security)/ },
  };

  const SEGMENTS = [
    { label: 'platform / device', re: /\b(ios|android|web|mobile|desktop|device|app version|browser)\b/ },
    { label: 'geography', re: /(geograph|region|countr|market|locale|\bcity\b|language|timezone)/ },
    { label: 'new vs existing / cohort', re: /(new (vs|versus|and|or) (returning|existing)|new users?|existing users?|returning|cohort|tenure|lifecycle|sign-?up (week|month)|power users?|churned|resurrect)/ },
    { label: 'acquisition channel', re: /(acquisition|channel|organic|\bpaid\b|referral|traffic source|campaign|utm)/ },
    { label: 'persona / user type', re: /(persona|user type|\brole\b|admin|segment|demographic|\bage\b|smb|enterprise|casual|hobby|professional|beginner|expert|job to be done)/ },
    { label: 'plan / value tier', re: /(\bplan\b|\btier\b|\bfree\b|premium|high-?value|arpu|ltv|revenue|spend|heavy|light users?)/ },
    { label: 'behavior / engagement', re: /(behavio|engagement|frequency|activation|feature adoption|funnel (step|stage)|session)/ },
  ];

  const DIAG = [
    { label: 'a recent release / product change', re: /(release|update|version|\blaunch|ship|deploy|redesign|feature flag|rollout)/ },
    { label: 'onboarding / activation', re: /(onboarding|activation|first[- ]session|aha|set-?up flow)/ },
    { label: 'acquisition mix shift', re: /(acquisition|channel|paid|campaign|mix|low[- ]intent|cohort quality|promo|traffic quality)/ },
    { label: 'seasonality / external events', re: /(season|holiday|school|weather|macro|calendar|one[- ]off|external)/ },
    { label: 'competitor / market shift', re: /(competitor|alternative product|market shift|substitute)/ },
    { label: 'measurement / data bug', re: /(instrument|tracking|logging|data (bug|quality|pipeline)|definition change|sdk|attribution|double[- ]count)/ },
    { label: 'performance / quality regression', re: /(crash|latency|bugs?\b|performance|outage|reliability|support tickets?)/ },
    { label: 'pricing / paywall change', re: /(pricing|paywall|price|trial|billing)/ },
    { label: 'checkout / payment friction', re: /(checkout|payment (fail|decline)|form|friction|drop-?off|page speed)/ },
    { label: 'notifications / re-engagement loops', re: /(notification|push|email|reminder|re-?engage)/ },
  ];

  const DRIVERS = {
    diag: DIAG,
    bvb: [
      { label: 'strategic differentiation', re: /(differentiat|core (to|competenc)|strategic|moat|commodity|non-?core)/ },
      { label: 'total cost of ownership', re: /(tco|total cost|maintenance|ongoing cost|licen[cs]e|headcount|opportunity cost)/ },
      { label: 'time-to-market', re: /(time[- ]to[- ]market|speed|ship (faster|sooner)|delay|months?)/ },
      { label: 'lock-in / exit options', re: /(lock-?in|switching cost|exit|portab|vendor risk|dependency|sla)/ },
      { label: 'integration, data & security', re: /(integrat|data (ownership|privacy|residency)|security|compliance|\bapi\b)/ },
      { label: 'hybrid / staged path', re: /(hybrid|pilot|\bpoc\b|proof of concept|buy now|build later|phase)/ },
    ],
    launch: [
      { label: 'regulation & licensing', re: /(regulat|licen[cs]|compliance|legal|tax|data law)/ },
      { label: 'localization', re: /(locali[sz]|language|culture|currency|payment (method|rails)|local preferences)/ },
      { label: 'local competition', re: /(competitor|incumbent|local player|market share)/ },
      { label: 'market size / demand', re: /(\btam\b|\bsam\b|market size|demand|addressable)/ },
      { label: 'go-to-market plan', re: /(go-to-market|\bgtm\b|channel|partner|distribution|pilot|beachhead|\bcity\b|launch plan)/ },
      { label: 'unit economics', re: /(unit economics|\bcac\b|\bltv\b|margin|payback|cost to serve|breakeven)/ },
      { label: 'operations / support', re: /(supply|logistics|support|operations|hiring|infrastructure)/ },
    ],
    prio: [
      { label: 'impact / value', re: /(impact|value|benefit|upside)/ },
      { label: 'effort / cost', re: /(effort|cost|eng-?weeks?|complexity|engineering time)/ },
      { label: 'confidence / evidence', re: /(confidence|evidence|data shows|certain|uncertain|validated)/ },
      { label: 'reach', re: /(reach|how many users|audience|affected)/ },
      { label: 'strategic fit', re: /(goal|okr|strategy|north star|fit|mission)/ },
      { label: 'dependencies / sequencing', re: /(depend|sequenc|unblock|prerequisite|foundation)/ },
      { label: 'learning / risk reduction', re: /(learn|de-?risk|experiment|test first|cheap test)/ },
    ],
    design: [
      { label: 'pain points', re: /(pain|problem|friction|struggle|frustrat|unmet need)/ },
      { label: 'jobs / motivations', re: /(job to be done|jtbd|\bneeds?\b|motivation|trying to get done)/ },
      { label: 'user journey / triggers', re: /(journey|flow|moment|trigger|workflow|day in the life)/ },
      { label: 'MVP / core loop', re: /(\bmvp\b|\bv1\b|smallest|core loop|wedge|first version|prototype)/ },
      { label: 'constraints (access, offline, cost)', re: /(constraint|accessib|privacy|offline|regulat|connectivity|low-?end device)/ },
      { label: 'existing alternatives', re: /(alternative|existing solution|workaround|today they|competitor)/ },
      { label: 'validation plan', re: /(interview|usability|prototype test|pilot|research|validate)/ },
    ],
  };

  /* ---------- case generation ---------- */

  const CONTEXTS = [
    { name: 'a fitness app with a monthly subscription', users: 'members' },
    { name: 'a B2B project-management SaaS', users: 'workspace admins' },
    { name: 'a food-delivery marketplace', users: 'diners' },
    { name: 'a language-learning app', users: 'learners' },
    { name: 'a consumer budgeting and payments app', users: 'account holders' },
    { name: 'a short-video creator platform', users: 'creators' },
  ];

  const TYPES = [
    { id: 'retention', label: 'Retention drop' },
    { id: 'conversion', label: 'Conversion fall' },
    { id: 'buildvsbuy', label: 'Build vs buy' },
    { id: 'launch', label: 'New market launch' },
    { id: 'prioritize', label: 'Prioritize 5 features' },
    { id: 'design', label: 'Design for a user' },
  ];

  const GEN = {
    retention() {
      const ctx = pick(CONTEXTS), from = int(38, 52), drop = int(5, 11), weeks = int(3, 6);
      const facts = shuffle([
        `New-user volume is up ${int(10, 35)}% since a paid campaign began.`,
        `A redesigned home screen shipped about ${weeks - 1} weeks ago.`,
        'Engineering reports no major outages.',
        'Early dashboards hint the drop is larger on one platform, but nobody has verified it.',
        'Support tickets mentioning "can\'t find" something are up.',
      ]).slice(0, 3);
      return {
        type: 'retention', diagnostic: true, drivers: 'diag',
        clarify: ['timing', 'scope', 'definition', 'changes', 'baseline', 'goal'],
        title: 'Day-30 retention is falling',
        prompt: `Day-30 retention for ${ctx.name} fell from ${from}% to ${from - drop}% over the last ${weeks} weeks. Leadership wants a diagnosis and a plan.`,
        facts,
        sample: {
          framing: 'Open with: "Goal: find out whether this drop is real, where it sits, and what we do in the next 2 weeks."',
          segmentation: 'Cut D30 by signup-week cohort, platform, acquisition channel, and new-vs-returning. Say which cut you would look at first and why.',
          hypothesis: 'e.g. "Paid cohorts have lower intent, so cohort D30 is lower even though per-channel retention is flat. I would check by comparing retention within each channel."',
          metrics: 'Primary: D30 retention by weekly signup cohort (baseline ' + from + '%, target recovery to ' + (from - 2) + '%). Guardrail: new-user volume and D1 activation. Leading: week-1 sessions.',
          prioritization: 'Rank your hypotheses by (likelihood x cost to check) and state the order you would test them in, plus what you would do if the first check comes back negative.',
        },
      };
    },
    conversion() {
      const ctx = pick(CONTEXTS), from = (Math.random() * 3 + 5).toFixed(1), to = (from - (Math.random() * 1.5 + 1)).toFixed(1), weeks = int(2, 5);
      const facts = shuffle([
        'Traffic to the pricing page is up, mostly from a new content partnership.',
        'Checkout was migrated to a new payment provider recently.',
        'Trial length was changed from 14 to 7 days last quarter.',
        'The free tier received two new features this month.',
        'Mobile web share of traffic grew noticeably.',
      ]).slice(0, 3);
      return {
        type: 'conversion', diagnostic: true, drivers: 'diag',
        clarify: ['timing', 'scope', 'definition', 'changes', 'baseline', 'goal'],
        title: 'Free-to-paid conversion is falling',
        prompt: `Free-to-paid conversion for ${ctx.name} dropped from ${from}% to ${to}% in the last ${weeks} weeks. Walk us through how you'd find the cause and what you'd do.`,
        facts,
        sample: {
          framing: 'Define the funnel first (visit -> signup -> trial -> pay) and say which step you suspect before you dive in.',
          segmentation: 'Break conversion down by funnel step, traffic source, device, plan and signup cohort. A drop concentrated in one step or source changes the whole diagnosis.',
          hypothesis: 'e.g. "The new partnership brings lower-intent traffic, so blended conversion fell while per-source conversion is flat. If true, conversion by source will be stable."',
          metrics: 'Primary: trial-to-paid rate (baseline ' + from + '%). Guardrail: revenue per visitor and payment failure rate. Leading: trial activation within 48h.',
          prioritization: 'State which two checks you would run first (cheapest, most likely) and what result would make you stop and escalate.',
        },
      };
    },
    buildvsbuy() {
      const ctx = pick(CONTEXTS);
      const cap = pick(['personalized recommendations', 'in-app search', 'fraud detection', 'customer-support chat', 'product analytics', 'notification delivery']);
      const months = int(4, 9), eng = int(3, 6), vendor = int(60, 240);
      return {
        type: 'buildvsbuy', diagnostic: false, drivers: 'bvb',
        clarify: ['strategy', 'scale', 'goal', 'alternatives', 'legal', 'success'],
        title: `Build or buy ${cap}?`,
        prompt: `${ctx.name[0].toUpperCase() + ctx.name.slice(1)} needs ${cap}. Engineering estimates ${eng} engineers for ${months} months to build in-house. A vendor offers it for $${vendor}k per year with a 2-week integration. Make a recommendation.`,
        facts: ['The roadmap is already full for two quarters.', 'The vendor is a 3-year-old startup.', 'Leadership wants a decision this week.'],
        sample: {
          framing: 'State the decision and the criterion up front: "The question is whether ' + cap + ' is a source of advantage for us or a commodity we should rent."',
          segmentation: 'Segment the need: which users or use-cases depend on this most? A vendor may cover 80% of cases while the other 20% decide differentiation.',
          hypothesis: 'e.g. "We believe buy is right because speed matters more than control right now. That holds only if the vendor covers our top 3 use-cases and exit costs stay low."',
          metrics: 'Compare 3-year TCO (build: ' + eng + ' eng x ' + months + ' months plus maintenance; buy: $' + vendor + 'k x 3 plus integration). Success metric: time-to-live and the business KPI it moves. Guardrail: latency or quality vs. today.',
          prioritization: 'Give a decisive recommendation, the conditions that would flip it, and a staged path (e.g. buy now, revisit build at a defined trigger).',
        },
      };
    },
    launch() {
      const ctx = pick(CONTEXTS), country = pick(['Brazil', 'Indonesia', 'Germany', 'Nigeria', 'Mexico', 'Japan', 'Poland']);
      const q = int(2, 4), team = int(5, 12);
      return {
        type: 'launch', diagnostic: false, drivers: 'launch',
        clarify: ['goal', 'user', 'alternatives', 'legal', 'success', 'scale'],
        title: `Launch in ${country}`,
        prompt: `Your company runs ${ctx.name} and is profitable in the US. The CEO wants to launch in ${country} within ${q} quarters. You have a cross-functional team of ${team}. How do you approach it, and would you go?`,
        facts: ['There is no local entity or local hires yet.', 'About 3% of current users are already in that country.', 'A well-funded local competitor exists.'],
        sample: {
          framing: 'Name the decision (go / no-go / pilot) and the 2-3 things that would have to be true for "go".',
          segmentation: 'Pick a beachhead: one city, user type or channel to start in, and say why. "All of ' + country + '" is not a segment.',
          hypothesis: 'State testable bets: "We believe existing diaspora/early users will convert at X because Y. We would test it with a 6-week pilot in one city."',
          metrics: 'Define pilot success numerically: activation rate, CAC payback window, and week-8 retention vs. US. Guardrail: support cost per user and compliance incidents.',
          prioritization: 'Sequence the work: what must be done before launch (legal, payments), what can wait, and what you would explicitly not do in phase 1.',
        },
      };
    },
    prioritize() {
      const ctx = pick(CONTEXTS);
      const pool = ['Dark mode', 'Referral program', 'Offline mode', 'AI-generated recommendations', 'Leaderboards and social sharing', 'In-app live chat support', 'Annual-plan discount', 'Personalized push notifications', 'Public API', 'Bulk import/export', 'Saved searches and wishlists', 'Team accounts'];
      const list = shuffle(pool).slice(0, 5).map((name) => ({ name, effort: int(2, 14), ask: int(2, 18) }));
      return {
        type: 'prioritize', diagnostic: false, drivers: 'prio',
        clarify: ['goal', 'success', 'user', 'scale', 'alternatives'],
        title: 'Prioritize five features',
        prompt: `You are the PM for ${ctx.name}. Your team can ship about 18 engineering-weeks of work next quarter. Prioritize these five candidates and explain what you would cut.`,
        list,
        facts: ['The company goal this quarter is improving retention.', 'Sales and support are each lobbying for a different feature.'],
        sample: {
          framing: 'Anchor on the goal first ("this quarter we optimize for retention") and the 18-week budget, then judge every feature against them.',
          segmentation: 'Say who each feature serves: new users, power users, or buyers. A 4% request rate means very different things in each segment.',
          hypothesis: 'For your top pick, state the bet: "We believe X will lift retention because Y; we would know within Z weeks if wrong."',
          metrics: 'Attach one metric to your #1 and #2 picks, with a target and a guardrail, so the roadmap is falsifiable.',
          prioritization: 'Use explicit criteria (impact, effort, confidence, reach), produce a ranked order that fits in 18 weeks, and name what you are NOT building and why.',
        },
      };
    },
    design() {
      const persona = pick(['night-shift nurses trying to protect their sleep', 'first-time home buyers', 'freelancers chasing late invoices', 'smallholder farmers selling produce', 'visually impaired daily commuters', 'new parents managing childcare logistics']);
      const n = int(4, 8), m = int(3, 6);
      return {
        type: 'design', diagnostic: false, drivers: 'design',
        clarify: ['user', 'alternatives', 'goal', 'success', 'scale', 'legal'],
        title: 'Design a product',
        prompt: `Design a product for ${persona}. You have a team of ${n} and ${m} months to a first release. What do you build first, and how will you know it's working?`,
        facts: ['There is no existing user research.', 'The business model is undecided.'],
        sample: {
          framing: 'Define the user and the one problem you are solving before proposing any solution.',
          segmentation: 'Segment inside the persona (e.g. by frequency of the problem or by context) and choose the sub-segment you build for first.',
          hypothesis: 'State the riskiest assumption and how you would test it cheaply before building: "We believe they currently solve this with X and would switch because Y."',
          metrics: 'Pick an activation metric and a retention signal with numeric targets, plus a guardrail such as trust, safety or accessibility.',
          prioritization: 'Cut to a v1 core loop. List what is deliberately excluded and the order of the next three bets.',
        },
      };
    },
  };

  function generateCase(typeId) {
    const id = typeId && GEN[typeId] ? typeId : pick(TYPES).id;
    const c = GEN[id]();
    c.id = id + '-' + Math.random().toString(36).slice(2, 8);
    const tok = (str) => (String(str).toLowerCase().match(/[a-z]{5,}/g) || []).join('|');
    c.topic = {
      retention: 'retention|d30|day-?30|churn',
      conversion: 'conversion|convert|trial|checkout|paywall|upgrade',
      buildvsbuy: 'vendor|in-house|\\bbuy\\b|build (vs|or)|total cost|licen[cs]e',
      launch: tok(c.title.replace('Launch in ', '')) + '|expansion|locali[sz]|regulat|go-to-market|\\bgtm\\b|beachhead|country',
      prioritize: (c.list || []).map((f) => tok(f.name)).filter(Boolean).join('|') + '|engineering-weeks|capacity|roadmap',
      design: tok(c.prompt.split('. ')[0].replace('Design a product for ', '')),
    }[id];
    c.label = TYPES.find((t) => t.id === id).label;
    return c;
  }

  /* ---------- scoring ---------- */

  const DIMS = [
    { id: 'framing', name: 'Problem framing', weight: 15 },
    { id: 'clarify', name: 'Clarifying questions', weight: 10 },
    { id: 'segmentation', name: 'Segmentation', weight: 15 },
    { id: 'hypothesis', name: 'Hypothesis quality', weight: 20 },
    { id: 'metrics', name: 'Metrics', weight: 15 },
    { id: 'prioritization', name: 'Prioritization', weight: 15 },
    { id: 'communication', name: 'Communication', weight: 10 },
  ];

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const uniq = (a) => Array.from(new Set(a));

  function scoreAnswer(raw, c) {
    const text = norm(raw);
    const words = text.match(/[a-z0-9%$'-]+/g) || [];
    const wc = words.length;
    const out = {};
    const D = DRIVERS[c.drivers];

    /* Problem framing */
    {
      const g = [
        { label: 'defines the problem or goal', re: /(define|definition|restate|the problem (is|here)|we(')?re trying to|the goal|objective|success (is|means|looks like)|the question is)/ },
        { label: 'states why it matters (business stakes)', re: /(business impact|why (this|it) matters|stakes|revenue|cost of|at risk|strategic|north star|company goal)/ },
        { label: 'states scope or assumptions', re: /(assum|scope|in scope|out of scope|for (this|the) (answer|purpose)|constraint)/ },
        { label: 'announces an approach or structure', re: /(my approach|framework|i'll (start|first|begin|structure|break)|first[, ]|step 1|structure|to start)/ },
        c.diagnostic
          ? { label: 'checks the data is real before diagnosing', re: /(is (it|this) real|instrument|data quality|sanity|measurement|tracking|definition change|verify the (drop|data))/ }
          : { label: 'frames the decision and options', re: /(the decision|trade-?off|criteria|options?\b|go\/no-go|recommend)/ },
      ];
      const hit = g.filter((x) => x.re.test(text));
      out.framing = {
        score: clamp(hit.length / 4) * 100,
        found: hit.map((x) => x.label),
        missing: g.filter((x) => !x.re.test(text)).map((x) => 'Did not: ' + x.label),
      };
    }

    /* Clarifying questions */
    {
      const sentences = text.split(/(?<=[.!?])\s+|\n+/);
      const asks = sentences.filter((s) => /\?|^\s*(what|when|where|which|who|how|why|is|are|does|do|did|can|could|will|would)\b|\b(ask|want to know|need to know|clarif|find out|confirm whether)\b/.test(s));
      const qCount = asks.length;
      const askText = asks.join(' ');
      const groups = c.clarify.map((k) => CLARIFY[k]);
      const hit = groups.filter((x) => x.re.test(askText));
      const early = text.slice(0, Math.max(200, text.length * 0.35)).includes('?') || /\b(ask|clarif)/.test(text.slice(0, Math.max(200, text.length * 0.35)));
      out.clarify = {
        score: (0.35 * clamp(qCount / 4) + 0.5 * clamp(hit.length / 3) + 0.15 * (early ? 1 : 0)) * 100,
        found: qCount ? [`${qCount} question${qCount > 1 ? 's' : ''} asked`].concat(hit.map((x) => 'Relevant: ' + x.label)) : [],
        missing: groups.filter((x) => !x.re.test(askText)).slice(0, 3).map((x) => 'Not asked: ' + x.q)
          .concat(early ? [] : ['Questions came late or never; ask them before you start analysing.']),
      };
    }

    /* Segmentation */
    {
      const hit = SEGMENTS.filter((x) => x.re.test(text));
      const act = /(prioriti[sz]e|focus on|target|start with|beachhead|double down|biggest|most (affected|impacted|valuable))/.test(text);
      out.segmentation = {
        score: (0.75 * clamp(hit.length / 4) + 0.25 * (act ? 1 : 0)) * 100,
        found: hit.length ? ['Cuts mentioned: ' + hit.map((x) => x.label).join(', ')] : [],
        missing: SEGMENTS.filter((x) => !x.re.test(text)).slice(0, 3).map((x) => 'No cut by ' + x.label)
          .concat(act ? [] : ['Segments were listed but you never said which one matters most or to start with.']),
      };
    }

    /* Hypothesis quality */
    {
      const marker = /(hypothes|my guess|likely|suspect|could be|might be|one possibility|i believe|we believe|bet)/.test(text);
      const because = /(because|due to|driven by|caused by|leads to|which would|so that)/.test(text);
      const testable = /(validate|test|experiment|a\/b|compare|check|look at|query|confirm|rule out|falsif|cohort analysis|holdout)/.test(text);
      const evidence = /(we would expect|should see|would show|signal|evidence|if (this|that) is (true|right)|if so|if not)/.test(text);
      const causes = D.filter((x) => x.re.test(text));
      const target = c.diagnostic ? 3 : 3;
      out.hypothesis = {
        score: (0.15 * marker + 0.15 * because + 0.25 * testable + 0.3 * clamp(causes.length / target) + 0.15 * evidence) * 100,
        found: (causes.length ? ['Considered: ' + causes.map((x) => x.label).join(', ')] : [])
          .concat(marker ? ['Stated explicit hypotheses or beliefs'] : [])
          .concat(testable ? ['Mentioned how to test or validate'] : []),
        missing: []
          .concat(marker ? [] : ['No explicit hypothesis ("I believe X because Y").'])
          .concat(because ? [] : ['No causal reasoning (the "because").'])
          .concat(testable ? [] : ['No way to validate or falsify the hypothesis.'])
          .concat(evidence ? [] : ['Did not say what you would expect to see if the hypothesis is true or false.'])
          .concat(D.filter((x) => !x.re.test(text)).slice(0, 3).map((x) => 'Did not consider: ' + x.label)),
      };
    }

    /* Metrics */
    {
      const names = uniq(text.match(/\b(retention|conversion|activation|dau|wau|mau|arpu|ltv|cac|nps|churn|funnel|csat|time to \w+|engagement|revenue|margin|payback|ctr|d1|d7|d30|tco)\b/g) || []);
      const guard = /(guardrail|counter-?metric|don't (hurt|regress)|must not|cannibal|trade-?off metric|shouldn't (drop|worsen))/.test(text);
      const ll = /(leading|lagging|proxy|input metric|output metric|early signal)/.test(text);
      const nums = (text.match(/\d+(\.\d+)?\s?(%|x\b|k\b|m\b|pp\b|pts\b|days?\b|weeks?\b|months?\b)/g) || []).length;
      const targ = /(baseline|target|threshold|goal of|lift|minimum detectable|\bmde\b|sample size|statistical|significan)/.test(text);
      out.metrics = {
        score: (0.25 * clamp(names.length / 3) + 0.25 * guard + 0.15 * ll + 0.15 * clamp(nums / 2) + 0.2 * targ) * 100,
        found: (names.length ? ['Metrics named: ' + names.slice(0, 6).join(', ')] : [])
          .concat(guard ? ['Included a guardrail'] : []).concat(targ ? ['Mentioned a baseline/target'] : []),
        missing: []
          .concat(names.length >= 3 ? [] : ['Fewer than 3 distinct metrics named.'])
          .concat(guard ? [] : ['No guardrail metric (something that must not get worse).'])
          .concat(ll ? [] : ['No leading vs. lagging distinction.'])
          .concat(nums >= 2 ? [] : ['Few or no numbers: no baselines, targets or thresholds.'])
          .concat(targ ? [] : ['No target, lift or decision threshold for the primary metric.']),
      };
    }

    /* Prioritization */
    {
      const crit = uniq(text.match(/\b(rice|ice|impact|effort|confidence|reach|cost of delay|moscow|kano|expected value|likelihood|urgency|risk)\b/g) || []);
      const rank = /(#1|\b1[.)]|first priority|top priority|prioriti[sz]e|\brank|\bp0\b|\bp1\b|do first|start with|sequenc|roadmap|then\b|next\b)/.test(text);
      const cut = /(trade-?off|not (do|build|ship)|defer|deprioriti|\bcut\b|descope|won't|out of scope|later|opportunity cost|not now)/.test(text);
      const dep = /(depend|risk|constraint|capacity|resourc|timeline|quarter|sprint)/.test(text);
      const decisive = /(i (would|recommend|'d)|we should|recommend|my pick|my decision|go with|the answer is)/.test(text);
      out.prioritization = {
        score: (0.3 * clamp(crit.length / 2) + 0.2 * rank + 0.25 * cut + 0.1 * dep + 0.15 * decisive) * 100,
        found: (crit.length ? ['Criteria used: ' + crit.slice(0, 5).join(', ')] : [])
          .concat(rank ? ['Gave an order or sequence'] : []).concat(cut ? ['Named trade-offs or things not to do'] : []),
        missing: []
          .concat(crit.length >= 2 ? [] : ['Fewer than 2 explicit prioritization criteria (impact, effort, confidence, reach...).'])
          .concat(rank ? [] : ['No ranked order or sequence.'])
          .concat(cut ? [] : ['Nothing is explicitly cut or deferred; prioritization means saying no.'])
          .concat(decisive ? [] : ['No decisive recommendation ("I would...").']),
      };
    }

    /* Communication */
    {
      const lengthScore = wc < 60 ? 0 : wc < 120 ? 0.7 * (wc - 60) / 60 : wc <= 700 ? 1 : Math.max(0.6, 1 - (wc - 700) / 800);
      const lines = String(raw || '').split('\n');
      const ordinals = (text.match(/\b(first(ly)?|second(ly)?|third(ly)?|finally|lastly|next|then|to start|to summari[sz]e)\b/g) || []).length;
      const structured = lines.filter((l) => /^\s*([-*•]|\d+[.)]|#+|[A-Za-z][A-Za-z /&]{1,30}:)/.test(l)).length + (ordinals >= 3 ? 3 : ordinals);
      const summary = /(tl;?dr|summary|recommend|bottom line|in short|to summari[sz]e|conclusion|my answer)/.test(text);
      const next = /(next step|then i would|follow[- ]up|rollout|roll out|timeline|owner|this week|in the next)/.test(text);
      const sentences = text.split(/[.!?]+\s|\n+/).filter((s) => s.trim().split(/\s+/).length > 2);
      const avg = sentences.length ? wc / sentences.length : 0;
      const filler = (text.match(/\b(basically|really|very|just|kind of|sort of|stuff|things|maybe)\b/g) || []).length / Math.max(1, wc) * 100;
      out.communication = {
        score: (0.2 * lengthScore + 0.25 * clamp(structured / 4) + 0.2 * summary + 0.15 * next + 0.1 * (avg > 0 && avg <= 28 ? 1 : avg > 0 ? 0.4 : 0) + 0.1 * (filler <= 3 ? 1 : 0.3)) * 100,
        found: [`${wc} words`].concat(structured >= 3 ? ['Used visible structure (bullets, numbering, labelled sections)'] : []).concat(summary ? ['Included a summary or recommendation'] : []),
        missing: []
          .concat(wc >= 120 ? [] : [`Only ${wc} words: too thin to evaluate your reasoning.`])
          .concat(wc <= 700 ? [] : ['Over 700 words: tighten for a spoken interview.'])
          .concat(structured >= 3 ? [] : ['Little visible structure; use numbered sections or labelled bullets.'])
          .concat(summary ? [] : ['No summary or lead-with-the-answer line.'])
          .concat(next ? [] : ['No concrete next steps, owners or timeline.'])
          .concat(avg <= 28 ? [] : ['Long sentences (avg ' + Math.round(avg) + ' words); shorter is easier to follow.'])
          .concat(filler <= 3 ? [] : ['Filler words ("really", "just", "stuff", "maybe") weaken the message.']),
      };
    }

    /* Assemble */
    const flags = [];
    const uniqueRatio = wc ? new Set(words).size / wc : 1;
    let mult = 1;
    if (wc === 0) mult = 0;
    else if (wc < 30) { mult = 0.3; flags.push('Answer under 30 words: score heavily reduced and not counted for streak or leaderboard.'); }
    else if (wc < 60) { mult = 0.6; flags.push('Answer under 60 words: score reduced.'); }
    if (wc > 40 && uniqueRatio < 0.4) { mult *= 0.6; flags.push('Highly repetitive text: score reduced.'); }

    const onTopic = !c.topic || new RegExp(c.topic, 'i').test(text);
    if (wc >= 30 && !onTopic) { mult *= 0.5; flags.push('Answer does not appear to address this case (none of its key terms appear): score halved.'); }

    const dims = DIMS.map((d) => {
      const r = out[d.id];
      const s = Math.round(clamp(r.score / 100) * 100 * (mult || 0));
      return Object.assign({}, d, { score: s, found: r.found, missing: r.missing, fix: c.sample[d.id] || '' });
    });
    const overall = Math.round(dims.reduce((a, d) => a + d.score * d.weight, 0) / 100);
    const weakest = dims.slice().sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))[0];
    return { overall, dims, weakest, words: wc, flags, counts: wc >= 30 };
  }

  function band(n) {
    if (n >= 90) return 'Very strong signals';
    if (n >= 75) return 'Strong structure';
    if (n >= 60) return 'Solid, with gaps';
    if (n >= 40) return 'Developing';
    return 'Early draft';
  }

  const api = { TYPES, CLARIFY, generateCase, scoreAnswer, band, DIMS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Arena = api;
})(typeof window !== 'undefined' ? window : globalThis);
