# Recording the backup demo video

A pre-recorded video is your insurance policy if Wi-Fi dies, the testnet stalls, or
MetaMask freezes during the live demo. **Record it the day before the presentation.**

## Tools

- **Windows 10/11 built-in:** Game Bar (`Win+G`) → record screen + microphone. Saves to
  `C:\Users\<you>\Videos\Captures`.
- **OBS Studio** (free, cross-platform): more control, better audio. Use a single "Display
  Capture" source and the default `Microphone/Aux` source. Record at 1080p / 30 fps.
- **Loom** (browser, free up to 5 min): nice if you want hosted playback with a fallback URL.

## What to record (target ≤ 5 minutes)

Follow [`demo-script.md`](./demo-script.md) verbatim. The key is that someone watching the
video alone, with no narration from you, can still understand what's happening.

Cover, in order:

1. (10 s) Show the verified contract on Sepolia Etherscan
2. (45 s) Manufacturer registers a product, signs in MetaMask, sees confirmation
3. (45 s) Manufacturer ships, distributor switches MetaMask profiles, receives
4. (30 s) Distributor ships, retailer receives, retailer marks sold
5. (30 s) Show the full 6-entry timeline with timestamps and addresses
6. (30 s) Try an unauthorized call from a wrong-role wallet → revert
7. (30 s) Open `/analytics` → show the lifecycle chart
8. (10 s) Hold on the final dashboard for 2-3 seconds — the closing frame

## Recording tips

- Close all unrelated apps and notifications (Slack, email, Discord) before pressing record
- Use a wired headset or external mic — laptop mics sound bad on big speakers
- Plan one take through the script with the tab switches before you press record
- Keep MetaMask popups visible — don't dismiss them too fast for the camera
- Talk through what you're doing as you click; if you re-record, re-narrate
- Save as **MP4 H.264** at ≤ 1080p — universally playable on any classroom projector

## Where to save

- Primary: this folder, as `backup-demo.mp4`
- Secondary copy on a USB stick, in case the team laptop fails on demo day
- Optional: upload to YouTube as **unlisted** and share the link in the slide-deck QR
  code on the last slide
