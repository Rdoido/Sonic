# SonicBet - Casino Gaming Platform PRD

## Original Problem Statement
User asked if they could send their existing site to be presented online. They uploaded a .zip via Google Drive containing their SonicBet platform (FastAPI + React). After deployment, user requested:
1. Replace static "CASHBACK EM PERDAS" banner at top with a custom slider/carousel
2. Make the site appearance more modern
3. Add more games with original icons

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI + Framer Motion + Embla Carousel
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT in httpOnly cookies (phone + password)
- **Design**: Mobile-first, dark theme with gold/blue/green/fuchsia accents

## User Personas
- **Primary**: Brazilian casino players (18+) looking for PG-style slot games
- **Secondary**: Affiliate marketers leveraging referral program

## Core Requirements (Static)
1. Legalized casino platform branding
2. Phone-based authentication (+55 Brazil) with password
3. PIX-only payments (deposit min R$ 10, withdraw min R$ 50)
4. Simulated/demo games (no real money gateway)
5. Portuguese (pt-BR) UI
6. Mobile-first responsive design
7. Bottom navigation: Início, Promoção, Depósito, Saque, Perfil

## ✅ Implemented

### Session 1 (Original - 2026-02-26)
- Full backend (45+ endpoints): auth, wallet, games, profile/VIP, redeem, referral, contact, promotions
- 6 games: Fortune Tiger/Rabbit/Snake/Ox/Mouse + Mina Misteriosa
- 8 pages: Home, Profile, Deposit, Withdraw, Promotions, GamePage, History, Invite, Support
- Static "CASHBACK EM PERDAS" hero banner

### Session 2 (Modernization - 2026-05-27)
**Hero Carousel** (`HeroCarousel.js`)
- Auto-rotating slider with 4 slides (5s interval) using embla-carousel-react
- Slides: Welcome Bonus R$500 / Cashback 30% / Mega Jackpot R$1.2M / Invite R$50
- Each slide: unique gradient bg, decorative pattern (dots/coins/sparkles/circles), CTA button, click-to-action handler
- Navigation: side arrows + bottom dot indicators
- Framer Motion enter animations per slide

**Modern UI**
- New background: radial gradient + ambient blur glows (yellow/fuchsia/cyan)
- Glass-morphism cards with subtle top-border gradient
- Quick stats strip: Ganhadores hoje / RTP máximo / Suporte 24h
- Modernized announcement bar with gradient bg
- Category tabs with glow shadows
- Improved game cards: shine sweep on hover, gradient border, scale animations

**11 New Games** (total now 17)
- PG: Dragon Hatch, Wild Bandito, Mahjong Ways
- Pragmatic Play: Gates of Olympus, Sweet Bonanza, Sugar Rush
- JILI: Lucky Neko, Aztec Gold
- Spribe: Aviator, Plinko
- Evolution: Crazy Time (with animated rotating wheel)

**Original Game Thumbnails** (`GameThumbnail.js`)
- Unique SVG/CSS-rendered design per game ID
- Decorative elements: starbursts, scatter dots, mahjong tiles, plinko pegs, rotating wheel, Chinese characters, etc.
- Gradient backgrounds matched to game theme
- Drop-shadow + glow effects on central icons

### Session 3 (Real PG-style Icons - 2026-05-27)
**AI-generated official PG Soft style artwork** for 6 most popular games using Gemini Nano Banana (gemini-3.1-flash-image-preview):
- fortune-tiger.png, fortune-rabbit.png, fortune-snake.png
- fortune-ox.png, fortune-mouse.png, mina-misteriosa.png
- Saved in /app/frontend/public/game-icons/
- GameThumbnail.js updated to serve PNGs for these 6 ids; SVG fallback retained for the other 11 games
- Generation script: /app/scripts/generate_game_icons.py (uses user's reference screenshot for style consistency)
- Cost: ~$0.24 in EMERGENT_LLM_KEY credits

## Tested
- Backend: 100% pass rate (19 pytest cases) — all 17 game IDs work, register/login, wallet, deposit, gameplay, recent winners, promotions

## Prioritized Backlog
### P1 - High Value
- Real PIX gateway integration (Mercado Pago / PagSeguro)
- AI-generated game thumbnails (Gemini Nano Banana) for ultra-original look
- Email verification + password recovery
- Live chat widget integration
- Daily check-in bonus system

### P2 - Medium
- Tournament/competition system
- VIP rewards/cashback automated processing
- Push notifications for big wins
- Admin panel for user/transaction management

### P3 - Nice to have
- Sports betting section
- Live casino games
- Mobile apps (iOS/Android)
- Crypto payments

## Known Limitations
- PIX is MOCKED (simulated instant deposit, no real gateway)
- Withdrawals are recorded as pending but never processed
- No rate limiting on auth endpoints
- No email verification (phone-only auth)
- Game thumbnails use SVG/CSS (not AI-generated images)

## Test Credentials
See `/app/memory/test_credentials.md`

## Public URL
https://site-showcase-88.preview.emergentagent.com
