# Static launch with switchable adapters

The tech spec designed a backend with accounts, a ledger, replay validation and a social feed for the MVP. For a two-person team we launch with static files only: save, share and social go through interfaces with a `local` adapter (the device and share links) and a `server` adapter chosen by one config flag. The only server at launch is an analytics Worker, which the game ignores if it fails. This removes outage and exploit risk at launch, and turning the backend on later means writing server adapters, not rewriting the game.

## Consequences

There is no cross-device save, no accounts and nothing of real value at launch, so server-side replay validation is not needed yet. Live presence, the first major update, is when the server adapters get written.
