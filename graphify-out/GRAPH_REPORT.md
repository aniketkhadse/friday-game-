# Graph Report - c:\Users\aniketk\Desktop\desk\game  (2026-04-28)

## Corpus Check
- Corpus is ~7,937 words - fits in a single context window. You may not need a graph.

## Summary
- 82 nodes · 101 edges · 6 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.82)
- Token cost: 100 input · 100 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Firestore State Management|Firestore State Management]]
- [[_COMMUNITY_Player UI and Logic|Player UI and Logic]]
- [[_COMMUNITY_Admin Panel Controls|Admin Panel Controls]]
- [[_COMMUNITY_Zustand Game Store|Zustand Game Store]]
- [[_COMMUNITY_Leaderboard Utilities|Leaderboard Utilities]]
- [[_COMMUNITY_App Root and Readme|App Root and Readme]]

## God Nodes (most connected - your core abstractions)
1. `assertDb()` - 9 edges
2. `selectLevel2Players()` - 7 edges
3. `joinPlayer()` - 6 edges
4. `normalizePlayer()` - 6 edges
5. `updatePlayer()` - 4 edges
6. `adminAction()` - 4 edges
7. `getTopLevel1Players()` - 4 edges
8. `runAction()` - 3 edges
9. `handleStartLevel2()` - 3 edges
10. `handleEndLevel1()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Admin Panel` --conceptually_related_to--> `Fun Friday Typing Challenge`  [INFERRED]
  app/admin/page.tsx → README.md
- `Player App` --conceptually_related_to--> `Fun Friday Typing Challenge`  [INFERRED]
  app/page.tsx → README.md
- `handleStartLevel2()` --calls--> `selectLevel2Players()`  [INFERRED]
  components\AdminPanel.tsx → store\firestore-game.ts
- `handleEndLevel1()` --calls--> `selectLevel2Players()`  [INFERRED]
  components\AdminPanel.tsx → store\firestore-game.ts
- `adminAction()` --calls--> `getTopLevel1Players()`  [INFERRED]
  store\game-store.ts → utils\game.ts

## Hyperedges (group relationships)
- **Firestore Realtime Sync** — app_admin_page, app_page [INFERRED 0.90]

## Communities

### Community 0 - "Firestore State Management"
Cohesion: 0.2
Nodes (16): assertDb(), booleanValue(), endLevel2(), ensureGameDocument(), getLocalPlayerId(), joinPlayer(), normalizePlayer(), numberValue() (+8 more)

### Community 1 - "Player UI and Logic"
Cohesion: 0.18
Nodes (9): handleJoin(), calculateTypingMetrics(), clamp(), getCorrectChars(), getTopLevel2Players(), getTopLevel2PlayersByCount(), isValidAristaUsername(), normalizeEmailInput() (+1 more)

### Community 2 - "Admin Panel Controls"
Cohesion: 0.32
Nodes (7): handleEndLevel1(), handleSelectionMode(), handleSelectionValue(), handleStartLevel2(), runAction(), endLevel1(), startLevel2()

### Community 3 - "Zustand Game Store"
Cohesion: 0.36
Nodes (4): adminAction(), effectiveState(), getSnapshot(), normalizeAdvancementPercent()

### Community 4 - "Leaderboard Utilities"
Cohesion: 0.5
Nodes (5): normalizePercent(), selectLevel2Players(), getTopLevel1Players(), getTopLevel1PlayersByCount(), sortLeaderboard()

### Community 5 - "App Root and Readme"
Cohesion: 0.67
Nodes (3): Admin Panel, Player App, Fun Friday Typing Challenge

## Knowledge Gaps
- **2 isolated node(s):** `Admin Panel`, `Player App`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `selectLevel2Players()` connect `Leaderboard Utilities` to `Firestore State Management`, `Admin Panel Controls`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `getTopLevel1Players()` connect `Leaderboard Utilities` to `Player UI and Logic`, `Zustand Game Store`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `adminAction()` connect `Zustand Game Store` to `Leaderboard Utilities`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `selectLevel2Players()` (e.g. with `handleStartLevel2()` and `handleEndLevel1()`) actually correct?**
  _`selectLevel2Players()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Admin Panel`, `Player App` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._