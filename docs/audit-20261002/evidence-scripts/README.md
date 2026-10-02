# Browser evidence scripts

Run from any directory. Evidence is written relative to these scripts, inside this checkout. Set `PLAYWRIGHT_MODULE` to the absolute path of an independently installed Playwright package. An installed Microsoft Edge is used in a fresh headless browser/context per run.

- `ui-qa.cjs`, `exam-ui-qa.cjs`: Vite dev at 127.0.0.1:4178.
- `production-qa.cjs`: final dist served by a plain static HTTP server at 127.0.0.1:4180; avoid the Vary: Origin header introduced by Vite preview for this offline check.
- Output: the checkout's docs/audit-20261002 folder. Test contexts contain synthetic local learning history only.
- `recovery-ui-qa.cjs`: the two corrected explanations, resumed version-1 history, bookmarks, supported settings and theme.
- Override dev/static addresses with `DEV_URL` and `STATIC_URL`. Recovery used dedicated ports 4285 and 4286, leaving the original task's servers alone.

The app's dependency manifest and lockfile do not include Playwright and were not changed.
