# Fun Friday Typing Challenge

Level 1 typing race and Level 2 word-identification game for an internal office event.

## Run

```bash
npm install
npm run dev
```

Player page: http://localhost:3000  
Admin panel: http://localhost:3000/admin

## Firebase

Create a Firebase web app, enable Firestore, and add these values in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Checks

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Notes

- Typing metrics are calculated locally on each player device for low input latency.
- Game state and player lists sync through Firestore `onSnapshot` listeners.
- Admin can choose whether 30%, 50%, or 100% of players advance after each level.
- Admin uses one state-based action at a time: waiting, level running, level done, final result, reset.
