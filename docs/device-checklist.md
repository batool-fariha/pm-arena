# Device test checklist

Automated tests cover the scoring engine. They cannot cover real phones, real microphones or Safari. Run through this before a release, and tick what you checked.

Use the live site or your own deployment. Use https or `localhost`; the microphone does not work from a file.

## iPhone, Safari

- [ ] Home loads without horizontal scrolling. The hero card and tiles stack neatly
- [ ] Set up a round (time, case type, name) and press **Start round**
- [ ] The case card reads well: the prompt paragraph is full width, not a narrow column
- [ ] **Dictate** asks for microphone permission, then fills the answer box as you speak
- [ ] Dictated questions end with a question mark, and the text can be edited
- [ ] Keyboard does not cover the **Submit answer** button
- [ ] Submit. The score ring, weakest-area tile and critique rows look right
- [ ] **Share** opens the share sheet. **Download image** saves a PNG
- [ ] **Post my score** works and the entry appears under Leaderboard, Global
- [ ] Start a drill from the result screen. The checklist is visible at the top
- [ ] Rotating the phone does not break the layout

## Android, Chrome

- [ ] Same list as above
- [ ] Dictation works. Note that Chrome sends the audio to Google's speech service

## Desktop, Safari and Chrome

- [ ] Hero wires connect to the tiles at a normal window width and after resizing
- [ ] Dictation works and **Stop dictating** stops it
- [ ] Timer reaches zero and auto-submits what you wrote
- [ ] **Copy text** puts the share text on the clipboard
- [ ] Progress section appears after a scored round, and **Clear history** empties it
- [ ] Tab through the page. Every control shows a visible focus ring and can be used with the keyboard

## If something fails

Note the device, browser and version, the case type, and what you saw. For dictation failures also say whether the browser asked for microphone permission. Open an issue with those details.
