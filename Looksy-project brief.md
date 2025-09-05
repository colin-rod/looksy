Got it — here’s the **updated unified v2 design doc**, now with the **Face Blurring Module** integrated into the pipeline.

---

# **👗 Outfit Scoring & Style Recommendation App — v2 Product & Tech Spec**

---

## **1\. Purpose & Goals**

Enable users to log outfits, score them against **their personal style goals**, and get actionable recommendations. Over time, track progress, share looks (with privacy by default), and shop missing items via affiliate feeds.

---

## **2\. System Overview**

* **Mobile App:** React Native (Expo for speed).

* **Backend:** Supabase (auth, DB, storage, edge functions).

* **AI Layer:** LLM (Claude/OpenAI) for outfit-to-JSON parsing \+ Style Scoring Module.

* **Commerce Layer:** Affiliate APIs (Zalando, ShopStyle, ASOS, Amazon).

* **Community Layer:** Opt-in sharing, feeds, challenges.

* **Privacy Layer:** Face Blurring Module before public sharing.

---

## **3\. Input & Output Flow**

**Step 1 — Upload**

* User uploads outfit photo → app sends to Supabase Storage.

**Step 2 — Face Blurring (Privacy Guard)**

* **On-device (preferred):** Mediapipe detects faces, blurs them before upload.

* **Alternative (serverless):** Supabase edge function runs OpenCV/Mediapipe, stores:

  * Original → private bucket (for AI processing only, not exposed).

  * Blurred → community bucket (for sharing).

**Step 3 — Outfit Parsing**

* AI model converts outfit to JSON schema (categories, colors, attributes).

**Step 4 — Style Scoring**

* Compare parsed outfit → user’s personal style profile (custom) \+ controlled taxonomy.

* Generate 0–100 style score, breakdown, and improvement hints.

**Step 5 — Recommendations**

* Missing/improvable items → mapped to affiliate catalog.

* Return at least 3 options in user’s size.

**Step 6 — Community (Optional)**

* If sharing enabled, blurred version of photo \+ score \+ suggestions appear in feed.

---

## **4\. Style Scoring Module**

**Inputs:** JSON detections, taxonomy rules, personal style profile.

**Outputs:** Score (0–100), breakdown, improvement hints.

**Scoring Weights:**

* Category Coverage (40%)

* Attribute Match (30%)

* Color Harmony (20%)

* Confidence Adjustment (10%)

**Personal Style Handling:**

* Personal styles mapped to taxonomy categories (e.g. “Chic” → 50% Business Casual, 30% Minimalist, 20% Glam).

* Adaptive learning: adjust mapping from user feedback.

---

## **5\. Dual Style System**

### **Controlled Taxonomy (fixed, system-defined):**

1. Minimalist

2. Streetwear

3. Business Casual

4. Formalwear

5. Athleisure

6. Bohemian (Boho)

7. Preppy

8. Smart Casual

9. Retro / Vintage

10. Y2K

11. Techwear

12. Glam / Party

### **Personal Style Profiles (user-defined):**

* Users can define styles in their own words (“Chic,” “Edgy,” “Parisian Summer”).

* Profiles define: favored categories, colors, patterns, disliked items.

* System maps them to taxonomy for scoring.

---

## **6\. Product Mapping Rules**

1. **Normalization:** JSON → structured query (category \+ attributes \+ colors).

2. **Catalog Query:** Affiliate APIs (Zalando, ShopStyle, ASOS, Amazon).

3. **Ranking:** Match score, size availability, brand affinity, commission.

4. **Fallback:** Relax filters if no results; always return ≥3 suggestions.

5. **Storage:** Cache results 24h in recommendations table.

---

## **7\. Community Layer (Phase 2\)**

* **Feed:** Share looks (with blurred faces).

* **Engagement:** Likes, comments, challenges.

* **Closet Sharing:** Optional “friends-only closet.”

* **Resale Potential:** Enable peer-to-peer resale later.

---

## **8\. Privacy & Risk Considerations**

* **Face Blurring:** Default ON for shared photos. On-device if possible.

* **Storage:** Originals kept in private bucket (AI-only) → deleted after processing.

* **GDPR:** Explicit opt-in, deletion requests honored.

* **Bias:** Frame scoring as *alignment with your chosen style*, not “good/bad.”

* **Age restrictions:** No under-16 without parental consent.

---

## **9\. Monitoring & KPIs**

* **Technical:** JSON parse success %, confidence distribution, latency.

* **User:** DAU/WAU, retention, score improvements over time.

* **Commerce:** Affiliate CTR & conversion rate.

* **Community:** Engagement per post, opt-in sharing rate.

---

## **10\. System Diagram**

\[ Mobile App \]  
   |   
   v  
\[ Face Blurring Module \]  
   |--\> blurred \--\> \[ Community Bucket \]  
   |--\> original \--\> \[ Private Bucket \] \--\> \[ AI Outfit Parser \]  
                                        \--\> \[ Style Scoring Module \]  
                                        \--\> \[ Product Mapping Engine \]  
   |  
   v  
\[ Supabase Backend \]  
   |--\> Auth / Profiles  
   |--\> Closet DB  
   |--\> Style Profiles  
   |--\> Recommendations  
   |--\> Community Feed  
---

✅ Now the doc includes **Face Blurring** as a first-class module, integrated into both privacy and system flow.

---

Do you want me to also add a **quick tech evaluation** (which face-detection library/API is best given you want a lean Supabase \+ Vercel stack)?

Great — thanks for the clear answers. Below is a **detailed technical implementation doc** for the MVP (expanded from the plan), using your choices: **OpenAI Vision** for parsing, **richer attributes** in the JSON schema, **server-side face blurring** (Supabase Edge), **discard originals**, **mocked recommendations**, **Supabase backend**, **Expo/React Native** for now (recommendation included), **full taxonomy scoring** with a hybrid approach, **manual testing** initially, and analytics later.

I organize it so you can start coding immediately: architecture, DB schema, API & edge functions, AI prompts & I/O, scoring engine spec, recommendation mapping, storage & privacy rules, tests (unit / integration / E2E), gate checks, CI/CD & deployment notes, cost/ops considerations, and a rough timeline.

---

# **MVP Technical Implementation (detailed)**

---

## **High-level architecture (MVP)**

Flow summary:

1. Mobile app (React Native via Expo) → user uploads image.

2. Supabase Storage receives image (private upload endpoint).

3. Supabase Edge function (Face Blur) runs server-side, returns blurred image for community use and proceeds to processing.

4. Edge function calls **OpenAI Vision** (Claude or GPT-4o/mini per cost/perf) with image URL to produce rich JSON.

5. JSON validated against schema and saved in Supabase (outfits, outfit\_items).

6. Style Scoring Module computes 0–100 score against user’s personal style profile (mapped to taxonomy); scoring breakdown persisted.

7. Recommendation Engine (MVP uses mocked dataset) generates 3+ suggestions; saved in recommendations table.

8. Blurred image made available to community feed only when user opts in. Originals are deleted immediately after parsing.

9. Mobile app fetches score, parsed items, and recommendations and displays them.

Components:

* Mobile: Expo (React Native), local image picker, upload UI, profile UI, results UI.

* Backend: Supabase (Auth, Postgres, Storage, Edge Functions).

* AI: OpenAI Vision (image input → structured JSON).

* Edge compute: Supabase Edge Functions (Node/TS) running face blur (OpenCV or node bindings) and orchestrating AI calls.

* Mock recommendation dataset stored in Supabase or repo for MVP.

---

## **Tech choices & rationale / quick recommendations**

* **Mobile**: Use **Expo Managed workflow** for MVP. Pros: fast iteration, OTA updates with EAS, works with Expo Go for early testers. Eject later only if native modules are required (rare for MVP).

* **Backend**: **Supabase** — user auth, Postgres schema, storage, edge functions (serverless). Fits your preference.

* **Face Blur**: Server-side with Supabase Edge Function using a Node runtime \+ @tensorflow-models/face-detection or mediapipe bindings or opencv4nodejs (if available in Edge environment). If Edge environment restricts native modules, use a small containerized image-blur worker (or a lightweight JS-only library) — details below.

* **AI parsing**: **OpenAI Vision** (GPT-4o or gpt-4o-mini). Use low-detail mode first to minimize cost, but include full-detail fallback if confidences are low.

* **Scoring**: **Rules-based core** for determinism \+ **LLM explain** mode (prompt that generates human-friendly explanation using the scoring breakdown). This hybrid keeps the scoring auditable but friendly.

* **Recommendations**: Mock data stored in DB for MVP; mapping rules to query mock DB.

---

## **Data model (Supabase / Postgres)**

### **Tables (core)**

1. users — Supabase Auth used; additional fields in profiles.

2. profiles

id UUID PRIMARY KEY REFERENCES auth.users(id);  
display\_name text;  
gender text;  
sizes jsonb; \-- optional later  
personal\_styles jsonb; \-- \[{name: 'Chic', mapping: {Minimalist:0.5,BusinessCasual:0.3}}\]  
created\_at timestamptz;  
updated\_at timestamptz;

3. outfits

id uuid primary key;  
user\_id uuid references profiles(id);  
image\_path text; \-- blurred image path or null  
processing\_status text; \-- pending/processing/done/error  
created\_at timestamptz;  
deleted boolean default false; \-- when we delete original  
ai\_call\_meta jsonb; \-- OpenAI call response headers, tokensUsed etc

4. outfit\_items

id uuid primary key;  
outfit\_id uuid references outfits(id);  
item\_id text; \-- e.g. i1  
category text; \-- top/bottom/outer/dress/shoes/bag/hat/accessory/unknown  
subcategory text;  
bbox jsonb; \-- \[x\_min,y\_min,x\_max,y\_max\]  
confidence float; \-- 0..1  
colors jsonb; \-- {primary:'\#FFFFFF', secondary:null, palette:\[...\]}  
pattern text;  
material text;  
attributes text\[\]; \-- \['short\_sleeve','crew\_neck',...\]  
description text;  
brand\_guess text;  
created\_at timestamptz;

5. outfit\_scores

id uuid primary key;  
outfit\_id uuid references outfits(id);  
score int; \-- 0..100  
breakdown jsonb; \-- {coverage: x, attributes: y, color: z, confidence\_adj: w}  
persona\_alignment jsonb; \-- \[{persona\_name:'Chic',score:0.82}\]  
explanation text; \-- from LLM (optional)  
created\_at timestamptz;

6. recommendations

id uuid primary key;  
outfit\_id uuid references outfits(id);  
items jsonb; \-- list of {title,category,brand,price,url,match\_score}  
source text; \-- 'mock' or 'affiliate\_name'  
created\_at timestamptz;

7. audit\_logs (optional)

* track calls, failures, retries, OpenAI tokens, costs.

---

## **API / Edge functions**

We’ll implement a small set of Supabase Edge Functions (Node/TS). Each function runs server-side and uses Supabase client with service key.

### **1\.** 

### **/upload-presigned**

###  **(serverless)**

* Purpose: return a signed URL for direct client upload to Supabase Storage (private bucket).

* Flow:

  * Client calls with user\_id, gets signed URL or upsert policy.

  * Security: generate short-lived signed token.

### **2\.** 

### **/process-outfit**

###  **(main orchestrator)**

* Triggered after upload (client calls or storage webhook).

* Responsibilities:

  * Move/ensure file in private bucket.

  * Run **Face Detection & Blur** on the image (produce blurred image).

  * Upload blurred image to community bucket (if user opts in) or keep only blurred for internal processing.

  * Call **OpenAI Vision** with original (or blurred if required). Because you said discard originals, we suggest:

    * Use original temporarily via private bucket URL, call OpenAI, then delete original file after successful parse. Alternatively, you can send the blurred image if OpenAI performance with blur is acceptable.

  * Validate JSON schema returned.

  * Save outfits \+ outfit\_items.

  * Call scoring engine (rules) → save outfit\_scores.

  * Call recommendations engine (mock) → save recommendations.

  * Publish a result event to user (push/notify) or client polls.

* Error handling:

  * Retries for AI calls (1 retry).

  * If low confidence \< threshold, mark outfit manual\_review\_required.

### **3\.** 

### **/blur-face**

###  **(if separate)**

* Input: private image path, options (blur level).

* Uses: face detection library → apply blur over face bboxes.

* Returns: blurred image path.

### **4\.** 

### **/debug/ai-parse**

###  **(dev-only)**

* For manual testing: re-run the AI parser on an image id.

---

## **Face Blurring details (server-side)**

Options for Supabase Edge:

* If Supabase Edge supports wasm and opencv.js or pure JS face detection (Mediapipe has JS port), prefer a **pure JS solution** to avoid native binaries. Example approach:

  * Use @mediapipe/face\_detection in Node with node-canvas to draw and blur regions, or use opencv.js \+ WASM.

  * Steps:

    1. Download image from private bucket to Edge function memory / tmp.

    2. Detect faces → get bboxes normalized.

    3. For each bbox, blur region (Gaussian blur or pixelate).

    4. Save result to new blurred file in community bucket.

    5. Return blurred path.

* If Edge cannot run heavy WASM, implement a small **worker** (Cloud Run / Vercel Serverless) to run the blur with opencv-python in Python container. Supabase Edge calls this worker.

**Default approach (lean):** Try Node \+ @mediapipe/face\_detection \+ canvas — simpler to run in serverless.

**Privacy:** delete original after parsing (see retention below).

---

## **OpenAI Vision integration (image → structured JSON)**

### **I/O & prompt**

* Send the (private) image URL to OpenAI Vision with a carefully constructed prompt to return **strict JSON** (your existing Claude spec works; adapt to OpenAI).

* Use the richer attribute schema you want (fits, sleeve length, neckline, material estimates, boldness).

* Example prompt (short):

Analyze this image of one person and return ONLY valid JSON matching this schema: {image\_id, items: \[...\], overall\_style\_tags, quality, execution}. Include attributes: category, subcategory, bbox (0-1), colors (hex), pattern, material\_estimate, attributes, description, confidence. If uncertain use null or set confidence low. Do not include any other text.

* 

* Use few-shot examples (2-3) with expected outputs to reduce hallucination.

### **Cost control**

* Use small image resolutions; prefer gpt-4o-mini low-detail for most images; fallback to higher detail if confidences are low.

* Track token/image counts in audit\_logs.

### **Validation**

* Implement JSON schema validation function (server-side) and reject/trigger fallback if schema invalid.

---

## **Style Scoring Module (detailed)**

You asked to support **full taxonomy**. We’ll use a **deterministic rules-based engine** to ensure predictable scores, and also call an LLM to produce a natural-language explanation of the score (optional).

### **Inputs**

* outfit\_items (with attributes \+ confidences).

* profiles.personal\_styles mapping (user-defined → taxonomy weights).

* styles taxonomy DB that for each style defines:

  * required categories (e.g., Formalwear: top+bottom+outer+shoes)

  * preferred attributes (patterns allowed/forbidden, color palettes)

  * weighting profile for attributes.

### **Scoring calculation (0–100)**

1. **Category Coverage (40 pts)**

   * For each required category present → allocate portion of 40\.

   * Missing required category \= negative penalty.

2. **Attribute Match (30 pts)**

   * For each item, compare attributes against style preferred attributes. Award points proportionally to matches weighted by item confidence.

3. **Color Harmony (20 pts)**

   * Compute dominant palette harmony score. For each item color, compute harmony w/ other items and style-preferred colors. Use simple color wheel harmony rules (monochrome/analogous/complementary).

4. **Confidence Adjustment (10 pts)**

   * Multiply subtotal by average item confidence (0..1) or apply small adjustments for occlusion/blur.

Example:

* RawScore \= (coverageScore \* 0.4 \+ attributeScore \* 0.3 \+ colorScore \* 0.2) \* confidenceFactor \+ confidenceAdj

* Map to integer 0..100.

### **Persona alignment**

* If user has personal style mapping (Chic → {Business Casual:0.5, Minimalist:0.3, Glam:0.2}), compute style score per taxonomy style, then compute a weighted sum to get persona\_alignment score.

### **LLM explainability prompt (optional)**

* After computing deterministic numeric score and breakdown, send to LLM:

Given the following breakdown: {coverage:..., attributes:..., colors:..., confidences:...} produce a short user-friendly explanation (2-3 sentences) and 2-3 concrete improvement suggestions prioritized by impact. DO NOT change the numeric score.

* 

* Store explanation in outfit\_scores.explanation.

---

## **Recommendations (Mock engine)**

MVP behavior:

* Identify top-1 or top-2 *weakest* areas (e.g., missing outer, pattern clash, color mismatch).

* Query local mock product table with fields: id, title, category, subcategory, colors\[\], material, style\_tags\[\], url, price.

* Matching rules:

  1. Exact category/subcategory match.

  2. Colors matching primary or complementary palette.

  3. At least one overlapping style tag with user’s persona or taxonomy style.

* Return up to 5 items; sort by match score, price (prefer mid-range), and a mocked “commission” score for later.

Store recommendations in recommendations table and show in UI. Each item includes mock\_source field.

---

## **Upload / Storage / Retention / Privacy rules**

* **Upload flow**:

  * Client requests presigned upload to private supabase bucket.

  * Client uploads file directly to private bucket.

  * Client calls /process-outfit with file path.

* **Processing**:

  * Edge function downloads image (from private bucket).

  * Run face detection/blur, create blurred image and upload to community bucket (only if user opts in to public share).

  * Call OpenAI Vision with private URL (valid for short time).

  * On successful parse, delete original file from private bucket immediately (per your request).

  * Save blurred image path in outfits.image\_path for internal display and community sharing.

* **Retention**:

  * Keep blurred image for 30 days by default, configurable per user. Allow user-initiated deletion instantly via UI.

  * Keep parsed JSON indefinitely unless user requests deletion.

* **Consent**:

  * During onboarding include explicit consent checkbox explaining images will be processed and originals deleted; blurred version may be shared if user opts-in.

---

## **Client (Mobile) details**

* **Framework**: Expo managed (fast iteration).

* **Key UI screens**:

  * Onboarding \+ consent.

  * Sign-up / sign-in (email/magic link via Supabase).

  * Profile page (personal styles management).

  * Upload / camera screen (take photo or pick).

  * Upload progress \+ processing status.

  * Results screen: Score \+ breakdown \+ items list \+ recommendations.

  * My Outfits list.

  * Settings: Delete images, privacy options (auto blur on/off for private storage), opt into community share.

* **Local handling**:

  * Compress images client-side before upload (reduce bandwidth).

  * Show blurred preview returned by server or create temporary preview while uploading.

  * For face-blur: since you chose server-side, app only needs to display blurred image.

* **Choice on Expo vs bare**:

  * **Start with Expo Managed** for faster MVP. If you later require native packages for more performant face-detection client-side or native SDKs, eject.

---

## **Tests (unit, integration, end-to-end)**

You asked for definitions for each unit, integration, and E2E test.

### **Unit tests (per module)**

* **Supabase client wrapper**: creds, token refresh, error handling.

* **JSON Schema validator**: valid JSON accepted, malformed JSON rejected.

* **Scoring rules engine**: sample outfit\_items \-\> expected score outputs (for known cases).

* **Recommendation mapper**: query input \-\> expected item list (mock DB).

* **Face blur function**: given synthetic image with face bbox \-\> blurred region changed (pixel-check).

* **Edge function handlers**: simulated responses for success/fail.

Tools: Jest (Node), testing-library/react-native (UI components).

### **Integration tests**

* **Upload → Edge process**: use test Supabase project: upload file \-\> trigger /process-outfit \-\> expect outfits row created, outfit\_items populated, outfit\_scores exists.

* **AI-parsing fallback**: simulate low confidence \-\> ensure fallback (retry or use alternative smaller prompt).

* **DB relations**: outfit\_items linked to outfits, outfit\_scores linked to outfits.

### **End-to-End (manual & scripted)**

* Manual flows (initial): Sign up → set profile → upload photo → wait → see score \+ suggestions.

* Scripted E2E (later): use Detox or Appium if you move beyond manual testing. For MVP, maintain a checklist of steps and pass/fail scenario logs.

### **Acceptance criteria per gate (see Gate Reviews below)**

* Each gate has concrete acceptance criteria (listed later).

---

## **Gate reviews & criteria (expanded)**

We previously had phases; here are **more detailed gate checks** for moving forward.

### **Gate 0 — Setup & Auth**

* Repo scaffolded; CI (GitHub Actions) lint \+ build pass.

* Supabase project created; client keys stored securely (secret manager).

* Mobile app boots in Expo Go.

   **Pass if:** You can sign up a user via the app and see a profile row created.

### **Gate 1 — Profile & DB**

* Profile CRUD works via UI; fields persisted.

* Personal styles creation UI works (create, map to taxonomy weights).

   **Pass if:** 5 manual tests of create/read/update/delete pass.

### **Gate 2 — Upload & Face Blur**

* Client can presign upload and upload file to private bucket.

* Edge function blurs faces and returns blurred image path.

* Original removed once parsing finishes.

   **Pass if:** Upload 10 test images (varied lighting) → 10 blurred images created \+ originals deleted.

### **Gate 3 — AI Parse & Validation**

* OpenAI Vision returns compliant JSON for test images.

* Validator accepts JSON; outfits \+ outfit\_items rows created.

   **Pass if:** 20/25 test images parsed; failures logged with reasons \< 20%.

### **Gate 4 — Scoring Engine**

* Scoring engine runs and stores scores for all taxonomy styles.

* LLM explanation pipeline consumes breakdown and returns human-readable text (optional).

   **Pass if:** For 30 prepared test cases, the scoring module produces expected direction of score (higher for good examples) and explanations are coherent.

### **Gate 5 — Recommendations (Mock)**

* Recommendation engine returns ≥3 suggestions per outfit.

* UI displays results.

   **Pass if:** For 20 test outfits, at least 1 useful suggestion returned in 80% cases.

### **Gate 6 — End-to-end MVP**

* Full user flow from sign-up to score & recs works for 5 external testers in Expo Go with no show-stopping bugs.

   **Pass if:** 5 testers complete flow, and key metrics (parse latency \< 15s, success rate \> 80%) achieved.

---

## **CI/CD & deployment (MVP lean)**

* **Repo**: monorepo or two repos (mobile \+ backend) — monorepo recommended for single dev.

* **CI**: GitHub Actions:

  * Lint \+ typecheck (TS).

  * Run unit tests.

  * Build expo web for smoke test.

* **Deployment**:

  * Edge functions deployed via Supabase CLI in CI.

  * Expo publishes builds to Expo Go (dev channel) for testers.

* **Secrets**: Use GitHub Secrets for SUPABASE\_SERVICE\_ROLE\_KEY, OPENAI\_API\_KEY.

---

## **Monitoring, logging & cost controls**

* **Logging**:

  * Each edge function logs action \+ OpenAI response tokens \+ duration.

  * Create audit\_logs table for cost attribution.

* **Cost control**:

  * Track daily token & image counts, set hard limits and alerts.

  * For images, use low-detail mode first and only use high-detail on fallback.

* **Retries**:

  * Backoff strategy for AI calls (1 retry) and for face-blur worker.

---

## **Security & compliance**

* **Auth**: Use Supabase Auth with JWT tokens.

* **Storage**: private bucket for originals (deleted after processing), public bucket for blurred images only if user opts in.

* **Deletion**: user-requested deletion route deletes blurred images \+ DB rows.

* **GDPR**: record consent, support data export and deletion.

* **Rate limiting**: limit per-user API calls to prevent abuse.

---

## **Costs & rough estimates (MVP)**

* **Supabase**: free tier suitable for dev; expect \~$25–$50/mo when small user base.

* **OpenAI Vision**: estimated $0.0004–$0.002 per image in low-detail mode (see your earlier numbers) — track precisely in audit\_logs.

* **Edge compute**: minimal on dev; if using external worker for blur, expect small cloud run cost.

* **Expo**: free; EAS build costs may apply.

* **Total for small MVP (1k MAU, 20 uploads/user/month)**: main cost is OpenAI calls: 20k images \* $0.001 \= $20 / month (very rough) plus Supabase \~ $25 and small infra — overall \<$100–$200 / month for MVP scale; monitor carefully.

---

## **Implementation pseudo-code (core flows)**

### **Upload \+ orchestrator (simplified pseudo)**

// Client: request presigned URL \-\> upload file \-\> call /process-outfit  
// Edge function /process-outfit  
async function processOutfit({userId, filePath, shareToCommunity=false}) {  
  // 1\. download from private bucket  
  const imageBuffer \= await downloadFromSupabase(filePath)  
  // 2\. face blur  
  const blurredBuffer \= await blurFaces(imageBuffer)  
  const blurredPath \= await uploadToSupabaseCommunity(blurredBuffer) // only if shareToCommunity true or store blurred for display  
  // 3\. call OpenAI Vision with private signed URL  
  const aiJson \= await callOpenAIVisionWithImage(filePath) // or blurredPath if you prefer  
  validateSchema(aiJson)  
  // 4\. persist outfits \+ items  
  const outfitId \= await saveOutfit(userId, blurredPath, aiJson)  
  // 5\. scoring  
  const score \= computeScore(aiJson, userProfile)  
  await saveScore(outfitId, score)  
  // 6\. recommendations (mock)  
  const recs \= queryMockRecommendations(aiJson)  
  await saveRecommendations(outfitId, recs)  
  // 7\. delete original file from private bucket  
  await deleteFromSupabase(filePath)  
  return {outfitId, score, recs}  
}  
---

## **Tests defined (detailed)**

### **Unit tests**

* validator.test.ts: ensure JSON schema accepted & rejected.

* scoring.test.ts: several hard-coded outfits \-\> expected scoring buckets (e.g., \>80 for perfect).

* recommendation.test.ts: verify mapping logic returns expected mock items.

### **Integration tests**

* processOutfit.integration.test.ts: uses a test Supabase env with a small set of images; mock OpenAI responses to simulate latency and low/high confidence scenarios. Ensure DB rows exist.

### **E2E (manual)**

* Test 1: User sign-up and profile setup.

* Test 2: Image upload \-\> parse success \-\> score shown within 20s.

* Test 3: Low-quality image \-\> manual review flagged.

* Test 4: Share to community \-\> blurred image is what appears in feed.

Document each test with inputs, expected outputs, and pass/fail.

---

## **Timeline (solo dev, rough)**

Assuming lean dev and parallel tasks where possible:

* Week 0: Setup & scaffolding (repo, supabase project, expo scaffold) — 2–3 days.

* Week 1: Auth & Profiles UI \+ DB — 3–5 days.

* Week 2: Upload UI \+ presigned upload flow \+ storage — 4 days.

* Week 3: Edge function for face blur (prototype) \+ blurred upload — 5 days.

* Week 4: OpenAI Vision integration \+ schema validation \+ save items — 5 days.

* Week 5: Scoring module (rules engine) \+ explanation prompt → 5 days.

* Week 6: Mock recommendation engine \+ UI → 4 days.

* Week 7: Integration tests, manual QA & polish → 5 days.

* Week 8: Beta run with 5 testers on Expo Go, fix bugs \-\> MVP gate.

Total \~6–8 weeks depending on scope creep and testing.

---

## **Next actionable items I can deliver right away (pick any)**

5. Produce **full DB DDL SQL** for the tables above (ready to paste into Supabase).

   6. Create the **OpenAI Vision prompt pack** with the few-shot examples ready to use.

   7. Provide a **Supabase Edge function** starter template for face blur (Node/TS).

   8. Generate a **scoring engine implementation** (TypeScript) with unit tests and sample test cases.

   9. Provide an **Expo app starter** with auth, upload UI, and results screen wiring to a mocked backend.

Tell me which one(s) to build and I’ll produce them now.

