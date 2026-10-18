# Implementation Plan: Campaign Amplification Platform

A practical plan for building the prototype with a **Python backend** and a **React Native (Expo) mobile app**.

---

## 1. Can this be done in Python?

**Partly, and that is fine.**

| Part | Can it be Python? | Why |
|---|---|---|
| Backend and APIs | Yes | The brief explicitly allows "Python with FastAPI". |
| Database logic, state machine, fee and reach calculations | Yes | All of this lives in the backend. |
| Mobile app | No | The brief says the mobile prototype **must** use React Native with Expo. Python tools like Kivy or Flet would not meet that requirement. |

So the split is:

- **Python (FastAPI)** is the brain: data, rules, validation, permissions.
- **Expo (TypeScript)** is the face: screens, navigation, forms.
- They talk over a simple REST API with JSON.

If you have never used TypeScript, use it lightly. The mobile app is mostly screens that call an API, so you do not need advanced typing.

---

## 2. What we are building (in one paragraph)

A person finds a campaign, reads the story and sources, and contributes money. That money pays for **advertising the message**, not for the cause itself. A creator writes a campaign in five steps, submits it, and a reviewer approves it. Once funded and approved, the campaign gets promoted and a report is shown at the end.

If a first-time user can explain those three things (what it does, what their money pays for, what happens next), we have built the right thing.

---

## 3. Scope: what to build and what to skip

### Must work (the "golden path")

1. Browse without an account: Home, Explore (search, filter, sort), Campaign Detail
2. Back a campaign: amount, review, simulated payment, confirmation, tracking
3. Create a campaign: 5 steps, auto-saved draft, preview, submit, status timeline
4. Creator dashboard with status tabs
5. Activity feed (in-app notifications)
6. Campaign lifecycle enforced by the backend

### Nice to have

- Skeleton loaders, empty, error, and no-results states
- Guest checkout
- Profile tabs (created, backed, saved, payment history)
- A small reviewer screen or a demo button that moves a campaign forward

### Only if time remains

- Voice creation (use a demo mode, see section 9)
- AI-assisted drafting (use canned suggestions first)
- Drag-to-reorder story blocks (up/down arrow buttons are fine)
- Comments, push notifications, email

### Explicitly out of scope

- The real admin web interface (the brief says it is not part of the assignment)
- Real payments
- Real ad network integration

---

## 4. Tech stack

### Backend

| Need | Choice | Reason |
|---|---|---|
| Framework | FastAPI | Fast to write, automatic API docs at `/docs`, built-in validation |
| Validation | Pydantic | Ships with FastAPI |
| ORM | SQLAlchemy 2.x | Standard, well documented |
| Migrations | Alembic | Optional for a hackathon; `create_all()` is fine |
| Database | PostgreSQL (via Docker) with SQLite as a fallback | The brief hints at Postgres; SQLite means zero setup if Docker causes trouble |
| Auth | JWT (`python-jose` or `pyjwt`) + `passlib` for password hashing | Simple and stateless |
| Tests | pytest | At least cover the state machine and fee math |

### Mobile

| Need | Choice |
|---|---|
| Framework | Expo (React Native) + TypeScript |
| Navigation | Expo Router (bottom tabs + stack) |
| Server data | TanStack Query (React Query) |
| Local state | Zustand (for the creation draft) |
| Forms | React Hook Form + Zod |
| Icons | `@expo/vector-icons` (pick one icon set and stick with it) |

---

## 5. Project structure

```
campaign-amplify/
├── README.md
├── implementation.md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py               # FastAPI app, router registration
│       ├── config.py             # fee %, reach-per-dollar, settings
│       ├── database.py           # engine, session
│       ├── models/               # SQLAlchemy tables
│       │   ├── user.py
│       │   ├── campaign.py
│       │   ├── draft.py
│       │   ├── contribution.py
│       │   ├── notification.py
│       │   └── report.py
│       ├── schemas/              # Pydantic request/response shapes
│       ├── routers/
│       │   ├── auth.py
│       │   ├── campaigns.py
│       │   ├── drafts.py
│       │   ├── contributions.py
│       │   ├── activity.py
│       │   ├── reports.py
│       │   └── admin.py          # reviewer actions (small)
│       ├── services/             # business rules live here, not in routers
│       │   ├── lifecycle.py      # state machine
│       │   ├── fees.py           # fee calculation
│       │   ├── reach.py          # reach estimate
│       │   ├── payments.py       # simulated payment provider
│       │   └── notifications.py
│       ├── seed.py               # demo data
│       └── tests/
└── mobile/
    ├── app/                      # Expo Router screens
    │   ├── (tabs)/
    │   │   ├── index.tsx         # Home
    │   │   ├── explore.tsx
    │   │   ├── create.tsx
    │   │   ├── activity.tsx
    │   │   └── profile.tsx
    │   ├── campaign/[id].tsx     # Detail
    │   ├── back/[id]/            # amount, review, payment, confirmation
    │   ├── create/               # step1 ... step5, preview, submitted
    │   └── info/                 # FAQ, Terms, Privacy, etc.
    ├── components/               # CampaignCard, ProgressBar, StatusBadge, ...
    ├── lib/                      # api client, constants, formatters
    ├── store/                    # draft store
    └── theme/                    # colors, spacing, typography
```

**Rule of thumb:** routers only receive requests and return responses. All real decisions (can this campaign take a contribution? what is the fee?) live in `services/`. This is what makes the backend look designed rather than thrown together.

---

## 6. Data model

Keep it small. Seven or eight tables are enough.

```
User
  id, email, password_hash, display_name, is_admin, created_at

Campaign
  id, creator_id, title, category, creator_name, summary,
  cover_image_url, story (JSON), status,
  funding_goal, amount_raised, deadline,
  ad_headline, ad_description, cta_text,
  reach_settings (JSON), created_at, submitted_at

Source
  id, campaign_id, title, url

Draft
  id, user_id, current_step, data (JSON), updated_at

Contribution
  id, campaign_id, user_id (nullable for guests), guest_email (nullable),
  amount, fee, total, status, is_public (default false),
  created_at

CampaignUpdate
  id, campaign_id, message, created_at

Notification
  id, user_id, type, title, body, campaign_id, is_read, created_at

Report
  id, campaign_id, funds_raised, ad_spend, impressions, clicks,
  estimated_reach, measured_reach, created_at

ModerationLog
  id, campaign_id, actor_id, action, note, created_at
```

### Design decisions worth explaining in your README

- **Story is stored as an ordered list of JSON blocks.** Example:
  ```json
  [
    {"type": "heading", "text": "Why this matters"},
    {"type": "paragraph", "text": "..."},
    {"type": "image", "url": "...", "caption": "...", "credit": "..."},
    {"type": "stat", "value": "42%", "label": "..."}
  ]
  ```
  This makes reordering trivial and lets the creator preview and the public page use the same renderer.
- **Draft is a single JSON blob plus `current_step`.** It is simpler than a table per step, and auto-save is just one `PUT`.
- **Contribution status** is one of: `pending`, `succeeded`, `failed`, `cancelled`, `refunded`.
- **`is_public` defaults to false**, so backer names are private unless they opt in. The payment record stays complete either way.
- **`ModerationLog`** gives us the audit trail the brief asks for.

---

## 7. Backend business rules

This is where "strong backend logic" is earned. Build each of these as a small, testable function.

### 7.1 Campaign lifecycle (state machine)

```
draft
  -> submitted
       -> changes_requested -> submitted (resubmitted)
       -> approved -> available_for_funding
       -> rejected
available_for_funding
  -> goal_reached | funding_ended
       -> distribution_prep
            -> promoting
                 -> completed
Any active state -> cancelled
cancelled / failed -> refund_pending
```

Implementation idea in `services/lifecycle.py`:

```python
ALLOWED = {
    "draft": {"submitted"},
    "submitted": {"changes_requested", "approved", "rejected"},
    "changes_requested": {"submitted"},
    "approved": {"available_for_funding"},
    "available_for_funding": {"goal_reached", "funding_ended", "cancelled"},
    "goal_reached": {"distribution_prep"},
    "funding_ended": {"distribution_prep", "refund_pending"},
    "distribution_prep": {"promoting", "cancelled"},
    "promoting": {"completed"},
    "cancelled": {"refund_pending"},
}

def transition(campaign, new_status, actor, note=None):
    if new_status not in ALLOWED.get(campaign.status, set()):
        raise InvalidTransition(f"{campaign.status} -> {new_status}")
    campaign.status = new_status
    log_moderation(campaign, actor, new_status, note)
    notify_creator(campaign, new_status)
```

Key rules:

- **Reaching the goal does not start ads.** It moves to `distribution_prep`. Only an admin action moves it to `promoting`.
- **Contributions are only accepted in `available_for_funding`.** Return a clear error otherwise.
- **Illegal transitions return HTTP 409** with a readable message.
- **Every transition writes a `ModerationLog` row and (where relevant) a notification.**

### 7.2 Fee calculation (`services/fees.py`)

One function, used everywhere: review screen, receipt, use-of-funds breakdown.

```python
PLATFORM_FEE_PCT = 0.05
PROCESSING_FEE_PCT = 0.029
PROCESSING_FEE_FIXED = 0.30

def calculate(amount: float) -> dict:
    platform = round(amount * PLATFORM_FEE_PCT, 2)
    processing = round(amount * PROCESSING_FEE_PCT + PROCESSING_FEE_FIXED, 2)
    return {
        "amount": amount,
        "platform_fee": platform,
        "processing_fee": processing,
        "total": round(amount + processing, 2),   # what the backer pays
        "available_for_ads": round(amount - platform, 2),
    }
```

Decide once whether the backer pays the processing fee on top or it comes out of the amount, and apply that consistently. Write your choice in the README.

### 7.3 Reach estimate (`services/reach.py`)

```python
REACH_PER_DOLLAR = 120        # demo assumption
LOW_FACTOR, HIGH_FACTOR = 0.7, 1.3

def estimate(ad_dollars: float) -> dict:
    mid = ad_dollars * REACH_PER_DOLLAR
    return {"low": int(mid * LOW_FACTOR), "mid": int(mid), "high": int(mid * HIGH_FACTOR)}
```

- Used by Home hero, cards, backing screen, and creator Step 4.
- Always show a range and the label **"Estimated, not guaranteed."**
- Put the constants in `config.py` so they are visibly configurable demo assumptions.

### 7.4 Simulated payments (`services/payments.py`)

A fake provider that takes the contribution and returns an outcome. To make the demo of every state easy, decide the outcome from a test card or a selector in the checkout UI:

| Test input | Result |
|---|---|
| Card ending 4242 | succeeded |
| Card ending 0002 | failed |
| Card ending 0001 | pending (later flips to succeeded via a "refresh" call) |
| User taps Cancel | cancelled |

On success: increase `amount_raised`, create a notification, and auto-transition to `goal_reached` if the goal is met.

Label the checkout screen clearly as **"Simulated checkout, no real payment."**

### 7.5 Permissions

- Anyone can read published campaigns (no login).
- Creating or editing drafts requires login, and only the owner can touch them.
- Guest contributions are allowed with just an email (optional, for the receipt).
- `/admin/*` routes require `is_admin = true`.
- **Material edits to a published campaign** (title, story, ad copy, targeting, goal) send it back to review instead of saving silently.

---

## 8. API outline

```
Auth
  POST   /auth/register
  POST   /auth/login
  GET    /me

Campaigns (public)
  GET    /campaigns?search=&category=&sort=&status=
  GET    /campaigns/{id}
  GET    /campaigns/featured
  POST   /campaigns/{id}/save          # bookmark
  POST   /campaigns/{id}/follow
  POST   /campaigns/{id}/feedback      # No / Somewhat / Yes

Drafts (login required)
  GET    /drafts
  POST   /drafts
  GET    /drafts/{id}
  PUT    /drafts/{id}                  # auto-save target
  DELETE /drafts/{id}
  POST   /drafts/{id}/submit           # validates, creates Campaign, status=submitted

Creator
  GET    /me/campaigns?status=
  GET    /me/campaigns/{id}/analytics

Contributions
  POST   /campaigns/{id}/quote         # returns fees + reach for an amount
  POST   /campaigns/{id}/contribute    # creates contribution, runs simulated payment
  GET    /contributions/{id}           # receipt / status
  GET    /me/contributions

Activity
  GET    /activity
  POST   /activity/{id}/read
  GET    /me/notification-settings
  PUT    /me/notification-settings

Reports
  GET    /campaigns/{id}/report

Admin / reviewer (demo only)
  GET    /admin/review-queue
  POST   /admin/campaigns/{id}/approve
  POST   /admin/campaigns/{id}/request-changes
  POST   /admin/campaigns/{id}/reject
  POST   /admin/campaigns/{id}/start-promotion
  POST   /admin/campaigns/{id}/complete
  POST   /admin/demo/advance           # one-tap "move to next stage" for the demo
```

FastAPI will generate interactive docs at `/docs`, which is useful to show judges and to test while the mobile app is still being built.

---

## 9. Mobile app plan

### 9.1 Design foundations (do this first)

Create a `theme/` folder with:

- **Colors:** one primary color, one accent, neutral greys, plus semantic colors (success, warning, error). Keep it calm and restrained.
- **Spacing scale:** 4, 8, 12, 16, 24, 32. Never use random numbers.
- **Type scale:** title, heading, body, caption. Body text at 16px minimum.
- **Touch targets:** at least 44px tall.

Then build the shared components once and reuse them:

| Component | Used on |
|---|---|
| `CampaignCard` | Home, Explore, Profile |
| `ProgressBar` | Cards, detail, dashboard |
| `StatusBadge` | Dashboard, detail, activity |
| `Accordion` | Use of Funds, Review Process, Audience & Distribution |
| `StepIndicator` | Creation flow |
| `SkeletonCard` | Loading states |
| `EmptyState` / `ErrorState` | Every list |
| `PrimaryButton` / `SecondaryButton` | Everywhere |

### 9.2 Screens, in build order

1. **Navigation shell:** 5 bottom tabs with placeholder screens.
2. **Home:** hero with two buttons and a reach-per-dollar line (labelled estimate), featured campaigns, feed, How It Works (Create, Review, Amplify).
3. **Explore:** search box, category chips, sort and filter sheet, results list with skeleton, empty, and no-results states. Search and filters call the backend, not just local arrays.
4. **Campaign Detail:**
   - Header: back, cover, category, title, creator, date, share, status
   - Story blocks rendered in order
   - **Sources section visible to everyone**
   - Accordions: Use of Funds, Audience & Distribution, Review & Trust
   - Feedback prompt (No / Somewhat / Yes)
   - **Sticky bottom bar** with % funded and a Back This Campaign button
5. **Backing flow:** Amount (presets + custom, live reach) → Review (fee table, "not a donation" notice, terms) → Simulated checkout → Result (success, pending, failed, cancelled) → Confirmation with receipt, updated progress, share.
6. **Create tab:** two entry cards (Manual, Voice) and a "Resume draft" card if one exists.
7. **Creation steps 1 to 5:** see 9.3.
8. **Submitted screen:** confirmation and a status timeline (Submitted, In review, Approved, Funding, Promoting, Completed).
9. **Creator dashboard** (inside Profile or reached from Create): tabs for Drafts, Under Review, Funding, Promoting, Completed, Requires Action.
10. **Activity tab:** grouped notifications, unread indicator, settings link.
11. **Profile tab:** account, created, backed, saved, payment history, settings, help links.
12. **Info pages:** About, How It Works, FAQ, Help, Contact, Terms, Privacy, Community Guidelines, Partners. These can share one simple template screen.

### 9.3 Campaign creation flow

**Order is fixed: Basics, Story, Campaign & Ad Visuals, Reach, Submit. No extra screens in between.**

**How state works:**

- A Zustand store holds the whole draft.
- On every change, a debounced (about 800ms) call does `PUT /drafts/{id}`.
- A small indicator shows "Saving..." then "Saved just now".
- Going back never clears data because it all lives in the store.
- Resuming a draft loads it from the server and jumps to `current_step`.

**Per step:**

| Step | Fields | Validation |
|---|---|---|
| 1. Basics | Title (max 60, live counter), category, creator name, summary, optional cover | Title, category, creator name required |
| 2. Story | Headline, intro, blocks (heading, paragraph, image, stat), sources (title + URL), suggested audience actions, live preview | At least one paragraph and one source recommended; URL format checked |
| 3. Ad Visuals | Cover, ad images, headline (defaults to start of title), description, CTA, placement previews | Basic file type and size checks, warnings for missing assets |
| 4. Reach | Locations, interests, channels, budget split, duration, audience preview | Clearly mark "You choose" vs "Finalized during review". Never promise a fixed audience |
| 5. Submit | Full preview, **funding goal (creator enters it manually)**, rules checkbox | Goal required and positive, checkbox required |

Buttons per step: Back, Save as Draft, Continue (Step 5: Preview Campaign, Submit for Review).

**Important:** the funding goal field starts empty in Step 5. No earlier step and no AI suggestion may fill it in.

**Preview tip:** build the campaign detail screen so it can render from a plain object. Then the Step 5 preview is the same component fed with draft data, which saves time and guarantees what the creator sees matches what the public sees.

### 9.4 Voice and AI (keep it honest and small)

- **Voice demo mode:** a screen with a mic button and a text box fallback. Either record and show a fake transcript, or let the user type what they would have said. Then call `POST /ai/draft-from-text` and land on an **editable** Step 1.
- **Backend AI endpoint:** for the hackathon, return a rule-based or template draft (extract a title from the first sentence, guess a category from keywords). If time allows, swap in a real LLM call behind the same endpoint.
- Always show a banner: "Draft generated from your description. Please review and edit."
- Never lock fields. Everything stays editable and deletable.

---

## 10. Seed data

Good demo data is half the polish. In `seed.py` create:

- **12 campaigns** across the 10 categories, a mix of creator types (nonprofit, individual, business, community group)
- Realistic titles, summaries, 3 to 5 story blocks, and 2 to 3 sources each
- Different statuses:
  - 7 available for funding at different progress levels (5%, 30%, 62%, 90%)
  - 2 promoting
  - 2 completed (**one with a full report**)
  - 1 under review (belongs to the demo creator)
- 1 demo creator account, 1 demo backer account, 1 admin account
- A handful of notifications and contributions
- A label on sample data: "Demo data" somewhere visible, such as the About page and the footer of Home

**One source of truth:** the raised amount shown on the card, detail page, dashboard, and profile must all come from the same API field.

---

## 11. Build phases

Each phase ends with something that runs. Do not move on with a broken phase.

### Phase 0: Setup (half a day)

- [ ] Create repo, `backend/` and `mobile/`
- [ ] FastAPI "hello" endpoint running, `/docs` opens
- [ ] Expo app opens on a real phone via Expo Go
- [ ] Mobile can call the backend (use your laptop's local IP, not `localhost`)
- [ ] Theme tokens and base components started

### Phase 1: Read-only experience (Day 1 to 2)

- [ ] Models, seed script, `GET /campaigns`, `GET /campaigns/{id}`
- [ ] Home, Explore with real search, filter, and sort
- [ ] Campaign Detail with story, sources, accordions, sticky bar
- [ ] Skeleton, empty, no-results, and error states

**Done when:** a user can browse everything without logging in and no button is dead.

### Phase 2: Backing flow (Day 3)

- [ ] `fees.py`, `reach.py`, `payments.py` with unit tests
- [ ] `/quote` and `/contribute` endpoints
- [ ] Amount, Review, Checkout, Result, Confirmation screens
- [ ] All four payment outcomes work
- [ ] Guest contribution works
- [ ] Funding progress updates everywhere after a contribution

**Done when:** you can back a campaign as a guest and watch the progress bar move on Home.

### Phase 3: Creation flow (Day 4 to 5)

- [ ] Auth (register, login, JWT) and protected routes
- [ ] Draft endpoints and auto-save
- [ ] Steps 1 to 5 with validation and the step indicator
- [ ] Preview using the detail component
- [ ] Submit creates a campaign with status `submitted`
- [ ] Submitted screen with status timeline

**Done when:** you can close the app mid-draft, reopen it, resume exactly where you left off, and submit.

### Phase 4: Lifecycle, dashboard, activity (Day 5 to 6)

- [ ] `lifecycle.py` with tests for legal and illegal transitions
- [ ] Admin endpoints and a small reviewer screen (or a "Reviewer mode" toggle in settings)
- [ ] `/admin/demo/advance` for the demo
- [ ] Creator dashboard with status tabs
- [ ] Notifications generated on each transition and contribution
- [ ] Activity tab with read/unread and settings
- [ ] Report screen with estimated vs measured metrics clearly separated

**Done when:** you can submit a campaign, approve it, back it to its goal, move it to promoting, complete it, and see notifications and a report along the way.

### Phase 5: Profile, polish, extras (Day 6 to 7)

- [ ] Profile tabs and payment history with receipts
- [ ] Info pages
- [ ] Voice demo mode (if time allows)
- [ ] Accessibility pass: contrast, label text, touch sizes
- [ ] Test on two screen sizes
- [ ] Remove or disable anything that does not work

### Phase 6: Ship (last day)

- [ ] README with setup, architecture, assumptions
- [ ] Demo script rehearsed
- [ ] Demo video recorded
- [ ] Fresh-clone test: can someone else run it by following the README?

---

## 12. Testing checklist

**Backend (pytest)**

- Every legal transition works, every illegal one returns 409
- Contributing to a non-funding campaign is rejected
- Fee calculation for a few amounts (including tiny and large)
- Reach estimate returns low, mid, high in order
- Goal reached moves to `distribution_prep`, not `promoting`
- A creator cannot edit another user's draft
- Material edit on a published campaign sends it back to review

**Mobile (manual walkthrough)**

- Browse with no account
- Search "water" and see results change; search nonsense and see the no-results state
- Turn the backend off and see a useful error screen, not a crash
- Fill Step 2, go back to Step 1, return, and confirm nothing was lost
- Back a campaign using each test card outcome
- Check text sizes on a small phone

---

## 13. Demo script (about 4 minutes)

1. **Home:** "Here is what the platform does" (hero, reach estimate, Create / Review / Amplify).
2. **Explore:** search and filter, open a campaign.
3. **Detail:** story, visible sources, Use of Funds ("this pays for ads, not the cause").
4. **Back it:** choose an amount, watch reach update, review fees, simulated checkout, confirmation, receipt.
5. **Create:** go through the 5 steps quickly, show auto-save and a resumed draft, set the goal in Step 5, submit.
6. **Reviewer mode:** approve the campaign, show the notification arriving.
7. **Dashboard:** show the status change and funding progress.
8. **Completed campaign:** open the final report, point out estimated vs measured numbers.

---

## 14. Assumptions to write in the README

- Payments are simulated; no real money moves.
- Fees: 5% platform fee plus simulated processing fee (values in `config.py`).
- Reach: 120 people per advertising dollar, shown as a 0.7x to 1.3x range. Demo assumption only.
- All campaigns, amounts, and reports are sample data.
- Voice and AI are demo-mode; the real versions would plug into a speech-to-text service and an LLM.
- No trust scores or "verified" badges are shown, because the prototype has no verification process.
- Admin is a minimal demo view; a production reviewer tool would be a separate web app.

---

## 15. Common mistakes to avoid

- Calling contributions "donations" anywhere in the copy
- Different numbers for the same campaign on different screens
- Adding extra screens between the five creation steps
- Letting AI or earlier steps set the funding goal
- Buttons that do nothing (hide them or label "Coming soon")
- Spending days on voice or AI before the golden path works
- Putting business rules in route handlers instead of `services/`
- Testing only on an emulator; always try a real phone

---

## 16. Quick-start commands

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic python-jose passlib[bcrypt] pytest
python -m app.seed                 # load demo data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Mobile**

```bash
cd mobile
npx create-expo-app@latest . --template tabs
npx expo install @tanstack/react-query zustand react-hook-form zod
npx expo start
```

Set the API base URL in `mobile/lib/api.ts` to `http://<your-laptop-ip>:8000` so a real phone can reach the backend.

---

**Final advice:** a smaller prototype where every button works, numbers match everywhere, and the "this funds distribution, not the cause" message is clear will beat a bigger one with gaps. Build the golden path first, then add polish.
