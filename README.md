# Alert Feed

Real-time alert feed over a WebSocket. React 19 + TypeScript + Vite, Tailwind v4.

## Running it

Node 20+ (developed on 22). Two terminals:

```bash
npm install
npm run server   # terminal 1 — ws://localhost:8080
npm run dev      # terminal 2 — http://localhost:5173
```

Tests need neither — the socket is mocked:

```bash
npm test
```

**Option A**, the provided Node server. One adaptation: Vite sets `"type": "module"`, so the
snippet's `require()` calls throw. I converted the imports to ESM and added a `PORT` override
plus connection logging — everything else is untouched. `VITE_WS_URL` points it elsewhere.

## Structure

```
src/lib/       framework-free logic — no React imports, testable in isolation
src/hooks/     useAlertFeed (socket, reconnect, outbound queue), useFollowScroll
src/components/ presentational, prop-driven, no socket awareness
```

The split that matters is `lib/` having no React in it — reconnect pacing and filtering are
plain functions over plain data.

## Decisions

**Messages sent while disconnected.** Optimistically echoed and queued: the message appears
immediately marked `queued`, the text is parked in a ref, and on the next `open` the queue
flushes in order and items flip to `sent`.

The caveat: this is at-least-once at best. `ws.send()` only guarantees the frame was
buffered, not delivered. A real implementation needs client-generated ids and server acks.

**Markdown safety.** `react-markdown` + `remark-gfm`, deliberately no `rehype-raw`. The
guarantee isn't sanitisation — it's that there's no HTML parsing step at all, so raw HTML
arrives as text. `defaultUrlTransform` strips dangerous schemes from links. It doesn't stop
link text lying about its destination; only a CSP would.

**Reconnect.** Exponential backoff 500ms → 8s cap, with ±50% jitter. After 8 attempts the
badge shows Disconnected with a manual Retry.

Three cases `onclose` alone misses:

- *Silent connections* — if the peer vanishes without a close frame the socket sits in `OPEN`
  forever. 10s of silence is treated as dead. The handler schedules the retry directly rather
  than calling `close()` and waiting: against a frozen peer the closing handshake never
  completes, so `onclose` never fires.
- *Flapping* — `attemptCount` resets only after a connection survives 3s, so a server that
  accepts and instantly drops still backs off.
- *Coming back online* — `window.online` skips the remaining backoff.

**No component library.** I started with shadcn and removed it — every control here is a
native element, with no modal, dropdown or focus trap to justify `@base-ui/react`, `cva` and a
CLI for a styled `<button>`.

Kept: Tailwind, `lucide-react`, `clsx`, `react-markdown`. The theme is ~70 lines of semantic
tokens that flip on `prefers-color-scheme`, so no component needs a `dark:` variant.
`react-markdown` roughly doubles the bundle — the right trade for the safety guarantee, but
it's the heaviest thing here.

**Long lists.** Capped at 500 items; at the demo cadence a tab would otherwise grow by ~1,800
an hour. Virtualisation is the next step if that cap needed raising — left out because it adds
a dependency and fights the scroll-following.

**Auto-scroll.** Sticks to the newest message at the live edge, stops when you scroll away and
shows a "N new messages" pill. The count is derived from the last-seen item id, not
accumulated — a counter drifts when filters change the list underneath it — and computed from
the filtered list, so hidden alerts don't inflate it.

**Search.** `useDeferredValue` rather than debounce: the input stays instant, filtering trails
at low priority, React discards stale work, and there's no delay constant to guess at. It
matches raw markdown source, so `**Acme** Inc` won't match `Acme Inc`.

**Persistence.** Filter state only. Search deliberately isn't persisted — reopening to a feed
silently narrowed by yesterday's query has no visible cause. Reads are validated, and
distinguish "user hid everything" from "stored value is corrupt". Messages aren't persisted;
replaying yesterday's alerts in a live panel is arguably wrong.

## Known gaps

- **Jump-to-latest is unfinished.** Clicking the pill doesn't reliably land at the bottom when
  messages arrive mid-animation — `scrollTo` fixes its target at call time and the feed grows
  past it. Degrades gracefully: scrolling manually still works.
- **No connect timeout.** If a server accepts TCP but never completes the handshake, the socket
  stays `CONNECTING`, `onclose` never fires, and the badge sticks on "attempt 1". Same class as
  the silent-connection bug; fix is a timeout calling the retry path directly.

## Testing

`npm test` runs Playwright. This UI's risk sits in browser behaviour — scroll following,
reconnect, what the markdown renderer puts in the DOM — so the tests run against a real
browser rather than a fake one. `routeWebSocket` intercepts the socket, which makes the feed
deterministic instead of racing a server pushing every 2 seconds, and makes reconnect
testable by closing the mock.

## Accessibility

Filter chips are real buttons with `aria-pressed`. The feed is `role="log"` /
`aria-live="polite"`, the connection badge is `role="status"` so changes are announced without
moving focus, and each alert carries a visually-hidden type label so colour isn't the only
cue. Focus rings throughout; the jump animation respects `prefers-reduced-motion`.
