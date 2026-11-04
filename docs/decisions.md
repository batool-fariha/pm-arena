# Design decisions

A short record of the choices that shape PM Arena, why they were made, and what they cost. Each can be revisited.

## 1. A static front end with no framework or build step

**Context.** The product is a few screens and one scoring engine.
**Decision.** Plain HTML, CSS and JavaScript in `index.html`, with the engine in `engine.js`. No bundler, no framework.
**Consequences.** Anyone can open it with a static server and read all of it. Deploys are instant. The cost is a long single file and hand-written view rendering; if the app grows much more, splitting it into modules or adopting a framework becomes worthwhile.

## 2. A deterministic, transparent scorer as the base

**Context.** Candidates need instant, repeatable, explainable feedback, and the leaderboard needs a number that can be verified.
**Decision.** Score with explicit rules in `engine.js`, and show what was detected and missing for every dimension.
**Consequences.** The same answer always scores the same, nothing is a black box, and it costs nothing to run. The cost is that it matches patterns rather than understanding ideas, so it can be gamed and can miss good answers. The docs say so plainly, and the scorer is labelled a heuristic assessment everywhere.

## 3. The server re-scores instead of trusting the client

**Context.** A shared leaderboard that accepts a client-supplied score would be trivially forgeable.
**Decision.** `POST /api/scores` receives the answer and the case, rebuilds the case from its basic fields, runs the same `engine.js`, and ignores any score sent.
**Consequences.** Made-up numbers are impossible. The cost is that the answer text must be sent to the server once, which is why posting is opt-in and the answer is not stored. A determined user can still craft an answer that games the heuristics.

## 4. AI notes complement the score and never replace it

**Context.** A language model can judge reasoning in ways the heuristics cannot, but its output is not deterministic or verifiable.
**Decision.** The AI coach returns notes only, with no second score. Quotes are verified against the answer and dropped if not verbatim. It is opt-in per round and disabled without an API key.
**Consequences.** There is one score and one source of truth for the leaderboard, so the two systems cannot contradict each other. The cost is that the AI's judgment does not show up in the number.

## 5. A single JSON file in Vercel Blob for shared state

**Context.** The leaderboard and usage counters are small and low-traffic.
**Decision.** Store each as one private JSON file, updated with ETag preconditions and retries.
**Consequences.** There is no database to run or pay for and setup is one command. The cost is that every write rewrites the file and heavy concurrent traffic would cause retries and contention. If usage grows, move to a database or Redis with sorted sets.

## 6. Local-first and opt-in networking

**Context.** People will paste real work and thoughts into practice answers.
**Decision.** History, streaks and drills live only in `localStorage`. Anything that leaves the device (posting, AI notes, dictation) is started by an explicit button and described in the [privacy page](privacy.md).
**Consequences.** Strong privacy by default, and no accounts to build. The cost is that data does not follow a person across devices.

## 7. Relevance checked with terms from the case

**Context.** An answer written for a different case should not score well.
**Decision.** Each case carries key terms derived from its own details (the country, the capability, the feature names, the persona). An answer containing none of them is halved.
**Consequences.** Off-topic answers are caught without any language model. The cost is that a very short list of terms can miss a relevant answer that uses different words, which is why the penalty is a multiplier and not a rejection.

## 8. Calibration by removing blocks

**Context.** Heuristic rules drift: a regex that is too loose quietly inflates scores.
**Decision.** Test by building a strong answer from one block per dimension and removing each block in turn. The matching dimension must fall by at least 20 points.
**Consequences.** This exposed several signals that passing mentions or generic words could satisfy, and now stops them regressing. The cost is that the fixtures are hand-written and cover two cases, so they should grow with the rubric.
