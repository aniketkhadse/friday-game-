# Graph Report - c:\Users\aniketk\Desktop\desk\game  (2026-04-28)

## Corpus Check
- Corpus is ~8,055 words - fits in a single context window. You may not need a graph.

## Summary
- 82 nodes · 101 edges · 6 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]

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
- `Player App` --conceptually_related_to--> `Fun Friday Typing Challenge`  [INFERRED]
  app/page.tsx → README.md
- `Admin Panel` --conceptually_related_to--> `Fun Friday Typing Challenge`  [INFERRED]
  app/admin/page.tsx → README.md
- `handleStartLevel2()` --calls--> `selectLevel2Players()`  [INFERRED]
  components\AdminPanel.tsx → store\firestore-game.ts
- `handleEndLevel1()` --calls--> `selectLevel2Players()`  [INFERRED]
  components\AdminPanel.tsx → store\firestore-game.ts
- `adminAction()` --calls--> `getTopLevel1Players()`  [INFERRED]
  store\game-store.ts → utils\game.ts

## Hyperedges (group relationships)
- **Firestore Realtime Sync** — app_admin_page, app_page [INFERRED 0.90]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.2
Nodes (16): assertDb(), booleanValue(), endLevel2(), ensureGameDocument(), getLocalPlayerId(), joinPlayer(), normalizePlayer(), numberValue() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (9): handleJoin(), calculateTypingMetrics(), clamp(), getCorrectChars(), getTopLevel2Players(), getTopLevel2PlayersByCount(), isValidAristaUsername(), normalizeEmailInput() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.32
Nodes (7): handleEndLevel1(), handleSelectionMode(), handleSelectionValue(), handleStartLevel2(), runAction(), endLevel1(), startLevel2()

### Community 3 - "Community 3"
Cohesion: 0.36
Nodes (4): adminAction(), effectiveState(), getSnapshot(), normalizeAdvancementPercent()

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (5): normalizePercent(), selectLevel2Players(), getTopLevel1Players(), getTopLevel1PlayersByCount(), sortLeaderboard()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (3): Admin Panel, Player App, Fun Friday Typing Challenge

## Knowledge Gaps
- **2 isolated node(s):** `Player App`, `Admin Panel`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `selectLevel2Players()` connect `Community 4` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `getTopLevel1Players()` connect `Community 4` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `adminAction()` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `selectLevel2Players()` (e.g. with `handleStartLevel2()` and `handleEndLevel1()`) actually correct?**
  _`selectLevel2Players()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Player App`, `Admin Panel` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._