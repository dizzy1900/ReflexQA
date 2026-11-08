# ReflexQA: 90-second pitch

**0:00 · Hook**
"React has a manual QA suite: browser test cases that maintainers click through by hand before releases. We built an agent that does it for them, and gets cheaper every time it runs."

**0:10 · Show it (press L, or Replay last live run)**
"On the left is a real test case from `react/react`, `fixtures/dom`: steps to reproduce and an expected result. In the middle, Meta Muse Spark is the Driver. It sees the screenshot, picks the element, and selects, types and clicks in a real Chromium."

**0:30 · Subquadratic (point at the Judge card)**
"After every single action, SubQ Snap reads about 189,000 tokens of React DOM's actual source, plus the agent's whole memory and both screenshots, in about two and a half seconds for under a cent. It doesn't generate text. It returns calibrated probabilities: did the step work, are we done, does React meet the expected result, what next. That's a massive-context judge cheap enough to run on every click."

**0:50 · Recursive self-improvement (point at the RSI chart and lessons)**
"Generation 1 needs Meta. Generation 2 replays the skill it learned: zero Meta calls, three times faster, still verified by SubQ at every step. If the Judge rejects a replayed step, control goes back to Meta. After each run, Meta reflects and writes a lesson the next run uses. Then SubQ writes the curriculum: it ranked 31 untested React cases and picked the next one."

**1:10 · Output (PR modal)**
"Every manual case it passes comes out as a Playwright test, so React's hand-run suite turns into CI."

**1:20 · Close**
"Meta for eyes and hands, Subquadratic for judgement and memory, and an agent that writes its own curriculum. The whole run cost under five cents."

## Prize mapping
- **Overall:** autonomous GUI testing that improves itself (skills, lessons and a self-written curriculum) on a real, famous codebase.
- **Meta:** Muse Spark does multimodal computer use, including perception, grounding, actions and reflection, on Meta's own React.
- **Subquadratic:** SubQ Snap as a fast, cheap, calibrated decision layer over ~189K tokens of React source on every step, checked against DOM ground truth (7/7).

## If asked
- *"Is it real?"* Open `demo/react-run.json`, or run `GET /api/run?suite=react` live.
- *"Why not let Meta judge too?"* SubQ returns calibrated probabilities rather than prose, so the loop can threshold them, and it reads the whole React DOM source for $0.0075 per judgement.
- *"Milliseconds?"* A small yes/no decision takes ~0.4s. A full 189K-token judgement with two images takes ~2.5s.
