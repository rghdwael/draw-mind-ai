# Draw Mind AI

An AI-powered mobile mental wellness app that helps parents understand their children's emotional state by analyzing drawings.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo (React Native), expo-router, react-native-svg, expo-linear-gradient

## Where things live

- `artifacts/mobile/` — Expo mobile app
- `artifacts/api-server/` — Express API server
- `artifacts/mobile/context/AppContext.tsx` — global state with children & drawings
- `artifacts/mobile/constants/colors.ts` — Design tokens (Draw Mind AI purple theme)
- `artifacts/mobile/app/` — All screens (expo-router file-based routing)
- `artifacts/mobile/components/` — Shared UI components

## Architecture decisions

- Frontend-only for first build: all data stored in AsyncStorage via AppContext, no backend required
- Mock AI analysis: analysis results are generated client-side using randomized templates
- react-native-svg + PanResponder for the drawing canvas (Expo Go compatible)
- Custom dark navy (#24124D) tab bar using ClassicTabLayout (NativeTabs bypassed for brand control)
- Inter font (pre-loaded in scaffold) — satisfies "Poppins or Inter" requirement

## Product

Draw Mind AI lets parents:
1. Create profiles for each child (name, age, gender, emotional notes)
2. Draw on a canvas or upload drawings for AI analysis
3. View emotion breakdowns (happiness %, sadness %, etc.)
4. Track each child's emotional development over time
5. Chat with an AI psychology assistant or connect with doctors

## Screens

- Welcome/Splash — purple gradient with mascot + Get Started CTA
- Login/Sign Up — email/password + Google/Apple social buttons
- Home Dashboard — greeting card, stats, children avatars, quick actions
- Children's Drawings — filter tabs, drawing cards per child
- Chat — AI Assistant (chat UI) + Doctors tab
- Profile — stats, premium banner, settings
- Add Child — form with avatar color picker
- Choose Child — selectable child cards before drawing
- Drawing Canvas — SVG canvas with pencil/brush/eraser tools + color picker
- Analysis Result — emotion bars, AI summary, behavioral insights, recommendations
- Child Analysis — per-child overview with emotion graph + drawing gallery
- Drawing Detail — full analysis for a specific drawing

## User preferences

- Soft premium purple UI (#6C4DFF, #B89CFF, #F5F1FF, #24124D)
- Mobile-first, Dribbble-quality design
- No emojis in UI — icons only
- Rounded corners (24–32px)

## Gotchas

- Do NOT use uuid package — crashes on iOS/Android. Use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead
- react-native-svg is pre-installed (v15.12.1) — works in Expo Go
- useAnimatedStyle must NOT be called inside .map() — extract to separate components

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
