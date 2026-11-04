# User guide

PM Arena is practice for product management case interviews. You get a case, answer against a clock, and see what your answer did and did not contain.

> Scores are heuristic assessments of how an answer matches common PM-answer patterns. They are not hiring assessments and do not predict interview outcomes.

## Your first round

1. **Set up.** On the home page choose a time limit (5, 10 or 15 minutes) and a case type, or leave it on Random. Add a name only if you plan to post to the shared leaderboard. Press **Start round**.
2. **Read the case.** The left card has the prompt and "What you know". Some facts are red herrings, and a strong answer asks what it still needs to know.
3. **Answer.** Type, or press **Dictate** and speak. The five chips above the box (Questions, Segments, Hypothesis, Metrics, Recommend) insert a starter for that part. Press **Submit answer**, or let the timer run out, which submits what you have.
4. **Read the result.** See [Reading your result](#reading-your-result).

## Case types

| Type | You are asked to |
|---|---|
| Retention drop | Diagnose a fall in retention and propose a plan |
| Conversion fall | Diagnose a fall in free-to-paid conversion |
| Build vs buy | Recommend building or buying a capability |
| New market launch | Decide how and whether to launch in a country |
| Prioritize 5 features | Rank five features against a capacity limit and say what to cut |
| Design for a user | Design a first product for a specific kind of person |
| Define success metrics | Say how you would measure whether a launch worked |

Cases are generated with random companies, numbers, countries and features, so repeating a type still gives you a new case.

## Writing an answer that scores well for the right reasons

The scorer rewards habits that good PM answers share. Doing them genuinely will raise your score; stuffing keywords will not make the answer better, even if it scores.

- **Ask before you analyse.** Start with questions about timing, scope, definitions and goals.
- **Frame the problem.** One sentence on the goal and why it matters, then your assumptions and your approach.
- **Say you are segmenting.** "I would cut it by platform, cohort and channel, and start with paid users."
- **Make hypotheses falsifiable.** "I believe X because Y. I would test it by Z. If true, I would expect to see W."
- **Name the metrics properly.** A primary metric, a guardrail, a baseline and a target.
- **Rank and cut.** State your criteria, an order, and what you would not do.
- **End with a recommendation and next steps.**

Aim for 150 to 400 words in a 10-minute round. Under 30 words does not count at all, and under 60 is penalised. See the [scoring rubric](scoring.md) for every rule.

## Reading your result

- **The score** is out of 100 and is a weighted combination of seven dimensions.
- **Single biggest weakness** is the dimension that cost you the most, weighted by importance. Start there.
- **Full critique** shows each dimension's score. Open a row to see what the scorer found, what it did not find, and a fix written for that case.
- **Practise next** lists follow-up questions an interviewer could ask about your three weakest areas. Answer them out loud.
- **AI coach notes** appear only if the site has them enabled. See [AI coach notes](#ai-coach-notes).

## Drills

A drill is a 3-minute round on one dimension.

- Start one with **Drill this for 3 minutes** on your result, or **Drill [dimension]** in your progress section (it picks your weakest on average).
- The checklist at the top lists what the scorer looks for in that dimension. Some drills have hints for the case.
- Write 60 to 150 words about the case shown (120 to 250 for Communication). Only that dimension is scored.
- A drill passes at 70. Drills count toward your streak, but not toward your history averages or the leaderboard.

## Voice dictation

Press **Dictate**, allow the microphone when asked, and speak. Your words appear in the answer box and you can edit them before submitting. Basic punctuation is added, and sentences that start like a question end with a question mark.

- **Works in:** Chrome, Edge and Safari.
- **Privacy:** the audio is processed by your browser's speech service (Google for Chrome, Apple for Safari). Nothing is sent to PM Arena.
- **Embedded browsers** (for example a preview pane inside another app) usually block the microphone. Open the site in Chrome or Safari instead.

## Progress and history

After a scored round, the home page shows your score trend, your average per dimension with the weakest flagged, your drill count, and your recent rounds with the answers you wrote. This is stored only in your browser. **Clear history** removes it. Clearing the site's data in your browser removes everything, including your streak.

## Streaks and leaderboards

- **Daily streak:** a day counts when you finish a scored round or drill. Miss a day and it resets.
- **This device:** your own best scores, stored in your browser.
- **Global:** a shared board. Posting is your choice: after a round press **Post my score**. See [Privacy](privacy.md) for what is sent. The server re-scores your answer itself, so the board reflects real scores, but it is a practice board and can still be gamed with keyword-heavy answers.

## AI coach notes

When enabled, **Get AI coach notes** sends your answer and the case to an AI model, which writes specific notes: what your answer did, the biggest weakness with a quote from what you wrote, a note per dimension, and a sentence that would have helped. The notes include no score. Quotes are checked against your answer and removed if they are not word for word. The notes can still be wrong, and they are not a hiring assessment. There is a daily limit, after which the button reports it.

## Frequently asked questions

**Is the score a prediction of how I would do in an interview?** No. It measures whether your written answer contains patterns that good answers share. A good idea phrased unusually can score low and a keyword-heavy answer can score high.

**Why did my short answer score so low?** Answers under 30 words are heavily reduced and do not count. Under 60 words is reduced. Write at least a paragraph.

**Why was my score halved with a warning about the case?** None of the case's key terms appeared in your answer, for example the country or the feature names, so it looks like an answer to a different case.

**Can I retake the same case?** Yes, press **Retry this case** on the result.

**Do you keep my answers?** Not on the server. See [Privacy](privacy.md).

## Troubleshooting

| Problem | What to try |
|---|---|
| Dictate says the microphone is blocked | Click the lock icon by the address bar and set Microphone to Allow, then reload. On a Mac also enable your browser under System Settings, Privacy and Security, Microphone. If you are in an embedded preview, open the site in Chrome or Safari |
| Dictate reports the speech service could not be reached | Chrome needs an internet connection for dictation. Try again online, or type |
| There is no Dictate button | Your browser has no speech recognition, for example Firefox. Type your answer |
| "The shared board is not reachable" | The leaderboard service is temporarily unavailable. Your device board still works. Try again later |
| Posting says to wait a few seconds | The same connection posted within 20 seconds. Wait and try again |
| My history or streak disappeared | The site data was cleared, or you are in a private window. History is stored only in your browser |
| The AI coach button is missing | The site's owner has not enabled it |
| The share image does not download | Some in-app browsers block downloads. Use **Copy text**, or open the site in a regular browser |

If something else breaks, [open an issue](https://github.com/batool-fariha/pm-arena/issues/new/choose) with your device, browser and what you saw.
