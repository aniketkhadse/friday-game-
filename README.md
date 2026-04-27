# Fun Friday Typing Challenge

Level 1 typing race and Level 2 word-identification game for an internal office event.

## Run

```bash
npm install
npm run dev
```

Player page: http://localhost:3000  
Admin panel: http://localhost:3000/admin

## Checks

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Notes

- Typing metrics are calculated locally on each player device for low input latency.
- Admin monitoring uses lightweight polling through `/api/state`.
- Admin can choose whether 30%, 50%, or 100% of players advance after each level.
- Level 1 state is kept in memory for a single live game server process.
