# SonicBet - Casino Gaming Platform PRD

## Original Problem Statement
"Quero criar uma plataforma de jogos legalizada, com jogos de cassino como Fortune tiger e Fortune rabbit, crie pra mim uma página inicial com ícones de menu promoção cadastro"

Followed by: "Quero que crie uma plataforma de jogos pg com uma aparência semelhante a essa [98z.com screenshot], com ícones originais, página de cadastro de usuário e pagamento somente via pix com valores de depósito a partir de R$ 10,00, quero uma coisa bem completa com a página inicial modernizada, o nome vai ser SonicBet"

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI + Framer Motion
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT in httpOnly cookies (phone + password)
- **Design**: Mobile-first, dark theme with gold/blue/green accents (similar to 98z.com)

## User Personas
- **Primary**: Brazilian casino players (18+) looking for PG-style slot games (Fortune Tiger, Rabbit, etc.)
- **Secondary**: Affiliate marketers leveraging referral program

## Core Requirements (Static)
1. Legalized casino platform branding ("Plataforma Legalizada")
2. Phone-based authentication (+55 Brazil) with password
3. PIX-only payments (deposit min R$ 10, withdraw min R$ 50)
4. Simulated/demo games (no real money gateway)
5. Portuguese (pt-BR) UI
6. Mobile-first responsive design
7. Bottom navigation: Início, Promoção, Depósito, Saque, Perfil

## ✅ Implemented (2026-02-26)

### Backend (45/45 tests passing)
- `POST /api/auth/register` - Phone + password registration with welcome bonus (R$ 10)
- `POST /api/auth/login` - Phone + password login
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user (cookie or Bearer header)
- `GET /api/wallet/balance` - User wallet
- `POST /api/wallet/deposit-pix` - Simulated PIX deposit (R$ 10-10.000)
- `POST /api/wallet/withdraw` - PIX withdrawal request (min R$ 50, requires R$ 100 total_bet)
- `GET /api/wallet/transactions` - Transaction history
- `GET /api/games` - List 6 games
- `POST /api/games/{game_id}/play` - Play simulated slot game (42% win rate)
- `GET /api/games/history` - User game history
- `GET /api/games/recent-winners` - Public anonymized winners
- `GET /api/profile/vip` - VIP level (V0-V5 based on total_bet)
- `GET /api/profile/stats` - Game/betting statistics
- `POST /api/redeem` - Redeem promo codes (BEMVINDO10, SONICBET50, BONUS20)
- `GET /api/referral/info` - Invite code, count, earnings
- `POST /api/contact` - Support form submission
- `GET /api/promotions` - List 6 promotions (public)

### Frontend
- **Home** (`/`) - Hero banner, promo cards, category tabs, 6-game grid, winners ticker
- **Profile** (`/perfil`) - User info, VIP progress, balance, action menu (similar to screenshot 2)
- **Deposit** (`/deposito`) - PIX deposit with quick amounts + custom + 2-step flow
- **Withdraw** (`/saque`) - PIX withdrawal with key type selector
- **Promotions** (`/promocoes`) - 6 promotional cards
- **GamePage** (`/game/:gameId`) - Slot machine UI with animated reels
- **History** (`/historico`) - Game history + transaction history tabs
- **Invite** (`/convidar`) - Referral code, link sharing (WhatsApp, Telegram)
- **Support** (`/suporte`) - Contact form + FAQ

### Components
- SonicLogo - Custom lightning bolt logo
- BottomNav - 5-tab navigation with featured center button
- AuthModal - Phone+password register/login flow (similar to screenshot 1)
- GameCard - Game thumbnail with countdown for Mina Misteriosa
- WalletModal - Embedded in deposit flow

### Games (6 PG-style)
1. Fortune Tiger (RTP 96.81%) - original image
2. Fortune Rabbit (RTP 96.75%) - original image
3. Fortune Snake (RTP 96.50%)
4. Fortune Ox (RTP 96.71%)
5. Fortune Mouse (RTP 96.96%)
6. Mina Misteriosa (RTP 97.00%) - with countdown

### Design System
- Background: `#0a1628` (dark blue) / `#0d1f3a` (cards)
- Primary: Gold gradient `#FFD700 → #FFA500`
- Success: Green `#22C55E`
- Buttons: Blue (`ENTRAR`), Green (`REGISTRO`)
- Fonts: Outfit (headings), Inter (body)

## Prioritized Backlog

### P1 - High Value
- Real PIX gateway integration (Mercado Pago / PagSeguro)
- Email verification for password recovery
- Live chat widget integration (currently form only)
- Daily check-in bonus system

### P2 - Medium
- More games (currently 6, target 20+)
- Tournament/competition system
- VIP rewards/cashback automated processing
- Push notifications for big wins

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
- Welcome bonus credits to main balance (could be in bonus_balance)

## Test Credentials
See `/app/memory/test_credentials.md`
