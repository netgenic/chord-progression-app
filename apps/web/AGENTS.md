# Web application instructions

These rules extend the repository-level `AGENTS.md` for `apps/web`.

- Keep the web app a presentation and browser-integration layer. Import music operations from `packages/music-theory`; do not calculate chords, Roman numerals, keys, canonical hashes, or technical tags in components, hooks, stores, or query adapters.
- Keep server state, ephemeral UI state, audio state, and MIDI device state separate. Do not mirror the same source of truth across stores.
- Treat API responses, URL parameters, persisted browser data, MIDI messages, and imported files as untrusted runtime input.
- Preserve the guest flow for browsing, filtering, transposing, and playback. Require the API's authenticated flow for creating progressions, favorites, and community tags; never enforce permissions only by hiding controls.
- Keep secrets and privileged credentials out of browser bundles. Expose only explicitly public environment values.
- Audio and MIDI must be progressive enhancements. Request permissions and start audio only from an explicit user gesture, handle unsupported/denied devices, and dispose schedulers, subscriptions, listeners, and devices during cleanup.
- Components should be accessible by semantic role and keyboard, with visible focus and clear loading, empty, disabled, and error states. Do not rely on color alone.
- Prefer composition and small local state over speculative abstractions. Reusable pure domain behavior belongs in a package, not a React utility folder.
- Test component behavior at the component/unit level. Use Playwright only for critical integrated journeys such as finding a progression, changing key, playing it, signing in, and saving/favoriting.
- In browser tests, prefer user-visible roles and labels over CSS or implementation selectors. Use disposable local accounts and never production sessions.
