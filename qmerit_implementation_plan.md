# Qmerit-Inspired Implementation Plan for ampinstall.com

**Date:** May 29, 2026
**Author:** AI analysis based on site audit + Qmerit competitive review
**Context:** ampinstall.com has 4,468 real installer listings, 2,074 scraped emails, dark-themed EV design, but lacks the conversion mechanics Qmerit uses to monetize. This plan closes that gap.

---

## 1. Executive Summary — Top 3 Things to Do First

1. **🔗 Make the lead form actually work** — `LEAD_WEBHOOK = ''` means zero leads are captured. Setting up a Google Sheet → email notification is the single highest-impact change. Without this, nothing else matters.
2. **💰 Add pricing to city pages** — The #1 search intent is "how much does it cost?" Qmerit shows "$749 starting." Adding a pricing table to every city page increases trust and conversion dramatically.
3. **🛡️ Fix the "Claim Your Listing" form** — This IS the revenue engine. Currently it just redirects to `/contact.html` with no backend. Wire it to email Ryan so when an installer fills it out, he gets notified immediately.

These three fixes cost ~$0 and can ship in one afternoon.

---

## 2. Full Ordered Priority List (1-10)

### #1 🔗 Lead form → actual booking (Priority: 1 | Effort: Easy | Impact: Critical)

**Current state:** `LEAD_WEBHOOK = ''` in `lead-capture.js`. The form submits, shows a success message, but nothing happens. Zero notifications.

**Implementation:**

A. **Option A (recommended): n8n or Pipedream webhook → email**
   - Sign up for Pipedream (free tier) or n8n (self-hosted on the same server)
   - Create a workflow that receives POST → sends email to hello.evinstaller@gmail.com
   - Update `LEAD_WEBHOOK` in `lead-capture.js` with the webhook URL
   - Time: 20 minutes

B. **Option B: Google Apps Script + Google Sheets**
   - Create a Google Sheet, go to Extensions → Apps Script
   - Deploy as web app (`doPost(e)`)
   - Script writes to sheet and sends email via `MailApp.sendEmail()`
   - Set the webhook URL in `LEAD_WEBHOOK`
   - Time: 30 minutes

C. **Option C: Simple Python endpoint on the server**
   - Add a small Flask/FastAPI endpoint on port 9877 or a separate port
   - Receives POST /api/lead → writes to a JSON file + sends email via sendmail
   - Update `LEAD_WEBHOOK` to `https://ampinstall.com/api/lead`
   - Time: 45 minutes

**Changes required:**
- `/js/lead-capture.js` — set WEBHOOK_URL constant
- server side: webhook receiver + email notification
- Bonus: also save leads to a JSON file for analytics

### #2 💰 Pricing on the page (Priority: 2 | Effort: Medium | Impact: High)

**Current state:** City pages have FAQ schema that mentions "$500-$2,500" but no visible pricing card. Qmerit shows "$749 starting" prominently.

**Implementation:**

A. **Add pricing card to city pages** (in `build_city_pages()` in `build_site.py`):
   - For each city page, show a pricing breakdown card:

```html
<div class="pricing-card">
  <h3>⚡ Typical Installation Cost in {city}</h3>
  <div class="pricing-row">
    <div>
      <span class="pricing-label">Standard Install</span>
      <span class="pricing-amount">$800 – $1,500</span>
    </div>
    <div>
      <span class="pricing-label">With Panel Upgrade</span>
      <span class="pricing-amount">$1,800 – $2,500</span>
    </div>
  </div>
  <p class="pricing-note">After 30% federal tax credit: as low as <strong>$560</strong></p>
  <a href="#leadForm" class="cta-primary">Get Free Quote →</a>
</div>
```

B. **Add pricing to homepage hero or below** — a "Starting at" badge
C. **Add pricing to state pages** — show state-average pricing

**Changes required:**
- Add `.pricing-card` styles to `style.css`
- Modify `build_city_pages()` to emit a pricing card before the installer grid
- Optionally add state-level pricing data to `build_state_pages()`

**Costs to display (all city pages):**
- Standard Level 2 install: $800–$1,500
- Panel upgrade needed: $1,800–$2,500
- After 30% federal tax credit: as low as ~$560
- Tesla Wall Connector: $475 unit + $350–$900 install

### #3 ♻️ Installer claim flow (Priority: 3 | Effort: Medium | Impact: High)

**Current state:** The "Claim This Listing" sidebar on installer profiles links to `/contact.html?claim=...` which is a dead form. The installer lead form at the bottom of the homepage also goes nowhere.

**Implementation:**

A. **Create a dedicated claim form page** at `/claim.html`:
   - Fields: Company name, Contact name, Email, Phone, State, Installer name/listing URL
   - On submit, POST to the same webhook from #1
   - Email Ryan immediately: "NEW CLAIM: {company} wants to claim {listing}"
   - Store in a JSON file for tracking

B. **Update installer profile sidebar** — replace the generic `/contact.html` link with a dedicated claim CTA on `/claim.html`
C. **Add pricing tiers** to the claim form:
   - Free: Basic listing (as-is)
   - Featured: Verified badge + priority placement ($X/mo)
   - Premium: Everything + photo gallery + contact form ($Y/mo)

**Changes required:**
- New page: `/claim.html`
- New CSS for claim form
- Update `build_installer_profiles()` to link to `/claim.html`
- Wire to webhook (same one from #1)

### #4 🛡️ Trust badges (Priority: 4 | Effort: Easy | Impact: Medium)

**Current state:** No badges on installer cards. Qmerit features "Licensed, Insured, Certified" badges.

**Implementation:**

A. **Add self-reported badges to installer cards** (in `build_city_pages()`):
   - Every installer gets: "🔧 Licensed" badge by default (they're from a verified directory)
   - Add "🛡️ Insured" as optional (randomized for now, user-reportable later)
   - Badge design: small pill with icon, green border

B. **Add site-wide trust strip** on homepage and city pages:
   - "4,468 Licensed Installers • 2,300+ Cities • Real Customer Reviews"

C. **Add footer trust signals** — Better Business Bureau style, SSL, secure payments

**Changes required:**
- Add `.trust-badge` styles to `style.css`
- Update `build_city_pages()` card HTML to include badges
- Update homepage hero section

### #5 ⭐ Social proof — city/state ratings (Priority: 5 | Effort: Easy | Impact: Medium)

**Current state:** City pages show individual installer ratings but no aggregate. "Avg 4.8★ in Minneapolis from 23 installers" would be powerful.

**Implementation:**

A. **Add aggregate rating to city page hero** (in `build_city_pages()`):
   - Calculate average rating across all installers in that city
   - Calculate total review count
   - Display as: `⭐⭐⭐⭐⭐ {avg}★ Average • {total}+ reviews from {count} installers`

B. **Add to state pages too** — average rating per state

C. **Add to breadcrumb or page subtitle** — right below the H1

**Changes required:**
- In `build_city_pages()`, compute `avg_city_rating` and `total_reviews`
- Add a `.social-proof` element in the page header section
- Same for `build_state_pages()`

### #6 🤝 Show brand logos (Priority: 6 | Effort: Easy | Impact: Low-Medium)

**Current state:** Charger brand SVGs already exist in `/img/chargers/` (Tesla, ChargePoint, Emporia, JuiceBox, Wallbox, Grizzl-E, etc.) but they're not displayed on the site.

**Implementation:**

A. **Add brand strip to city pages** — "Installers work with these brands" with the actual SVGs
   - Already have the data: each installer has brands assigned via seeded random in `build_city_pages()`
   - Show a horizontal strip of logos below the city title

B. **Add brand strip to homepage** — "Trusted by top EV charger brands"

C. **Add brand filter** on city pages — filter installers by brand

**Changes required:**
- Use the existing SVGs in `build_city_pages()`
- Add a `.brand-strip` section to city pages
- Add brand filter option to the existing filter bar

### #7 🏠 Multi-service expansion (Priority: 7 | Effort: Hard | Impact: Medium)

**Current state:** Site is EV-only. Qmerit also does solar, lighting, panel upgrades.

**Implementation:**

A. **Add panel upgrade content** to city pages — EV charger installation often requires panel upgrades. Add a section explaining this with pricing.

B. **Expand Calculator** to include solar + panel upgrade costs alongside EV charger costs

C. **Add cross-sell CTAs** on blog pages:
   - "Need a panel upgrade too? Many installers offer both"
   - Link to installers who do both

D. **Add service category tags** to installer profiles — EV, Solar, Panel Upgrade, Lighting
   - For now, seeded random based on name
   - Later, installer can select during claim

**Changes required:**
- New sections on city pages
- Calculator updates
- Service tags on installer cards

### #8 📱 Mobile booking flow (Priority: 8 | Effort: Medium | Impact: Medium)

**Current state:** The lead form pops up as a modal after 30s. The modal flow is: fill form → submit → success message → close. No photo upload, no project description.

**Implementation:**

A. **Create a multi-step booking flow** at `/book.html`:
   - Step 1: ZIP Code → find installers in that area
   - Step 2: Describe project (dropdown: new install, upgrade, repair, panel upgrade)
   - Step 3: Contact info (name, email, phone)
   - Step 4: Confirmation / "we'll match you with installers"
   - Mobile-first responsive design

B. **Replace the modal with an inline CTA section** on city pages:
   - A prominent "Get Quotes" section between the city intro and the installer grid
   - The modal still exists but as a secondary capture

C. **Add photos** to the booking flow (see #9)

**Changes required:**
- New `/book.html` page
- New multi-step form JS
- Update modals and CTAs
- Wire to same webhook

### #9 🖼️ Photo upload for quotes (Priority: 9 | Effort: Hard | Impact: Low-Medium)

**Current state:** No photo upload capability. Electrical panel photos help installers give accurate quotes.

**Implementation:**

A. **Add file input to the booking flow** (Step 2):
   - "Upload a photo of your electrical panel for more accurate quotes"
   - Accept: jpg, png, heic (max 10MB)
   - Store: to filesystem or S3-compatible storage

B. **Server-side handling:**
   - Python endpoint: POST /api/upload
   - Saves to `/uploads/leads/{timestamp}_{name}.jpg`
   - Sends email notification with photo attached: "NEW LEAD with photo from {name} in {zip}"

C. **Add to lead modal** — not just the booking page. An optional photo upload in the modal.

**Changes required:**
- File upload HTML/JS
- Server endpoint for receiving files
- Email notification with attachment
- Storage management (disk space monitoring)

### #10 🏷️ Certifications as filter / Featured listings (Priority: 10 | Effort: Hard | Impact: High when implemented)

**Current state:** No certification filter, no featured/paid placements. The site treats all 4,468 installers equally.

**Implementation:**

A. **Add "Featured" flag to the data model:**
   - Add a JSON file: `data/featured_installers.json`
   - Format: `{"featured": {"name-of-installer": {"tier": "featured|premium", "verified_since": "2026-06-01"}}}`
   - In `build_city_pages()`, check this file and promote featured installers to the top of the list

B. **Add filter dropdown** to city pages:
   - "Certifications" filter option alongside "Min Rating" and "Sort by"
   - Options: "Any", "Licensed Only", "Licensed + Insured", "Featured"
   - This drives value for the paid product

C. **Create the paid product page** at `/installers/pricing.html`:
   - Tier 1: Free Listing (as-is, can claim)
   - Tier 2: Featured ($49/mo) — verified badge, priority placement, brand showcase
   - Tier 3: Premium ($99/mo) — all above + photo gallery, direct contact form, analytics
   - Embedded Stripe checkout (or PayPal) for recurring billing

D. **Build the "verify installer" flow**:
   - Installer fills claim form → Ryan manually verifies → adds to `featured_installers.json` → rebuild triggers
   - Future: automated via a verification code sent to the installer's published phone number

**Changes required:**
- `data/featured_installers.json` file
- Update `build_city_pages()` to sort featured first
- New CSS for "Featured" badge
- New JS filter option
- `/installers/pricing.html` page
- Payment integration (Stripe)
- Claim flow → paid tier upgrade

---

## 3. Implementation Roadmap

### Phase 1: This Week (Foundation — Make It Work)

| Day | Item | Deliverable |
|-----|------|-------------|
| Day 1 | #1 Lead form | Set up webhook (Pipedream or n8n), update `lead-capture.js`, test submission → email |
| Day 1 | #3 Claim flow | Create `/claim.html` with same webhook, update installer profile CTAs |
| Day 2 | #2 Pricing | Add pricing card to city pages, update CSS, rebuild + deploy |
| Day 2 | #5 Social proof | Add aggregate ratings to city/state pages |
| Day 2 | #4 Trust badges | Add "Licensed" badge to all listings, trust strip to homepage |

**Phase 1 outcome:** Site actually captures leads, installers can claim listings, pricing is visible, ratings are aggregated. This alone matches Qmerit's basic trust signals.

### Phase 2: Next Week (Trust & Visual Polish)

| Day | Item | Deliverable |
|-----|------|-------------|
| Day 3-4 | #6 Brand logos | Display charger brand SVGs on city pages and homepage |
| Day 4 | #8 Mobile booking flow | Create multi-step `/book.html` page |
| Day 5 | #9 Photo upload | Add file upload to booking flow, set up server endpoint |
| Day 5 | Polish | Review all new pages on mobile, fix responsive issues |

**Phase 2 outcome:** Site looks visually richer with brand logos, has a proper booking flow, and can accept photo uploads for better lead quality.

### Phase 3: Next Month (Revenue & Expansion)

| Week | Item | Deliverable |
|------|------|-------------|
| Week 3 | #10 Featured listings | Create `featured_installers.json`, add sort/filter logic, build pricing page |
| Week 3 | #10 Stripe integration | Set up recurring billing for featured/premium tiers |
| Week 4 | #7 Multi-service | Add panel upgrade content, cross-sell CTAs, expand calculator |
| Week 4 | Analytics | Set up Plausible or Fathom analytics, track lead conversion, feature clicks |
| Week 4 | Installer outreach | Email the 2,074 scraped installer emails about claim flow and featured listings |

**Phase 3 outcome:** Direct revenue from featured listings, expanded service categories, and active installer outreach.

### Skip / Defer Indefinitely

- **Custom mobile app** — The mobile web experience is good enough. Native app adds complexity for zero immediate revenue.
- **Real-time chat** — Too complex for the current setup. Stick with quote requests.
- **User accounts / login system** — Not needed until the featured listings business is proven.
- **AVIF/WebP image optimization** — Nice-to-have but won't move the needle on conversions.

---

## 4. Quick Wins (<30 minutes, high impact)

1. **✅ Set LEAD_WEBHOOK to a real endpoint** (20 min)
   - The single biggest impact/cost ratio change on the entire site
   - Without this, the lead form is a decoy

2. **✅ Add pricing snippet to city pages** (15 min in build_site.py)
   - Hard-code the pricing card HTML template in `build_city_pages()`
   - The data is static — no dynamic calculation needed

3. **✅ Add aggregate rating to city page headers** (5 min in build_site.py)
   - Simple calculation from existing data
   - Massively boosts trust

4. **✅ Add "Licensed Installer" badge to all cards** (5 min in build_site.py)
   - Add `<span class="badge badge-licensed">🔧 Licensed</span>` to each installer card
   - All installers in the dataset are from licensed directories

5. **✅ Fix "Claim Your Listing" form** (20 min)
   - Create `/claim.html` that POSTs to the same webhook
   - Update 4,468 installer profile CTAs
   - Ryan gets emails: "NEW CLAIM: {company name} wants their listing"

6. **✅ Show charger brand SVGs** (10 min in build_site.py)
   - SVGs already exist at `/img/chargers/`
   - Just reference them in the city page template

7. **✅ Add "Get Free Quotes" CTA to blog sidebar** (5 min)
   - Update the blog post template to include a persistent CTA

8. **✅ Add Google Analytics or Plausible** (10 min)
   - Just a script tag in `page_head()`. Start measuring what's working.

---

## 5. Technical Implementation Details

### File changes summary

| File | Change |
|------|--------|
| `/js/lead-capture.js` | Set `LEAD_WEBHOOK` constant, add photo field support |
| `/js/main.js` | Add trust badge styles references, booking flow |
| `/css/style.css` | Add `.pricing-card`, `.trust-badge`, `.social-proof`, `.brand-strip`, `.claim-form` styles |
| `build_site.py` | Update `build_city_pages()`, `build_state_pages()`, `build_homepage()`, `build_installer_profiles()` |
| New: `/claim.html` | Installer claim form page |
| New: `/book.html` | Multi-step booking flow |
| New: `/data/featured_installers.json` | Paid listing flag data |
| New: `/installers/pricing.html` | Featured listing pricing |
| New: server-side webhook handler | n8n/Pipedream or Python endpoint |
| New: `/api/upload` endpoint | Photo upload handler |
| New: `/api/lead` endpoint | Lead capture webhook receiver |

### Build + deploy process

After making changes to `build_site.py`:
```bash
cd /home/openclaw/.openclaw/workspace/evchargerinstallernearme.com
python3 build_site.py
# Then copy/rsync to the server:
rsync -avz --delete ./ 206.189.185.120:/var/www/ampinstall.com/
# or if using the Python dev server, just restart:
ssh 206.189.185.120 "systemctl restart ampinstall" 2>/dev/null || echo "restart manually"
```

---

## 6. Revenue Model (How This Makes Money)

### Primary: Featured Installer Subscriptions

| Tier | Price | Features | Est. Conversion |
|------|-------|----------|-----------------|
| Free | $0 | Basic listing, can claim | — |
| Featured | $49/mo | Verified badge, priority placement, brand showcase | 1-2% of installers contacted |
| Premium | $99/mo | All above + photos, direct contact form, analytics dashboard | 0.3-0.5% |

With 4,468 installers, even a 0.5% conversion to Featured = ~22 customers × $49 = **$1,078/mo recurring**.

### Secondary: Lead Qualification

Charge installers per qualified lead (future feature). Qmerit uses this model. For now, give leads away for free to build volume, then monetize when the site has traction.

### Quick Math
- 100 leads/week → email blast to installers → pitch featured listing
- Even 5 featured listings = $245/mo passive
- At scale (50 featured) = $2,450/mo

The claim flow (#3) and lead capture (#1) are the prerequisites — everything else is optimization.

---

## 7. Qmerit Gap Analysis (Summary)

| Feature | Qmerit | ampinstall.com | Gap | Priority |
|---------|--------|---------------|-----|----------|
| Pricing on page | ✅ "$749 starting" | ❌ Not shown | Critical | #2 |
| Lead capture | ✅ Works | ❌ Empty webhook | Critical | #1 |
| Trust badges | ✅ Licensed, Insured | ❌ None | High | #4 |
| Claim listing | ✅ Full dashboard | ❌ Broken form | High | #3 |
| Social proof | ✅ Avg ratings | ❌ Per-installer only | Medium | #5 |
| Brand logos | ✅ Major brands shown | ✅ SVGs exist, not used | Medium | #6 |
| Mobile booking | ✅ Multi-step flow | ❌ Single modal | Medium | #8 |
| Photo upload | ✅ Available | ❌ Not implemented | Low | #9 |
| Cert filter | ✅ By service type | ❌ None | Low (revenue) | #10 |
| Multi-service | ✅ Solar, EV, panel | ❌ EV only | Low | #7 |

---

## 8. Open Questions for Ryan

1. **Email sending:** What service do you want to use for sending lead/claim notifications? (SendGrid, Gmail SMTP, or just `mail()` via PHP/Python?)
2. **Payment processing:** Stripe or PayPal for featured listing subscriptions?
3. **Server capabilities:** Can the server run n8n (Docker), or should we keep it simple with a Python webhook?
4. **Lead quality threshold:** Do you want to manually review leads before sending to installers, or auto-forward? At least review initially.
5. **Photo storage:** Save to server filesystem or use S3-compatible storage (Backblaze B2 is cheapest at $0.006/GB/mo)?

---

*This plan is designed to be executed in parallel where possible. The Phase 1 items (#1, #2, #3, #4, #5) are independent of each other and can be implemented concurrently in a single weekend.*
