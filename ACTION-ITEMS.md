# Action Items — Image Gen MVP
**From meeting:** 2026-02-14
**Deadline:** Next Wednesday (team presentation)
**Check-in:** Thursday with Nav

---

## PRIORITY 1 — Must Do Before Wednesday Demo

### Get Image Generation Working
- [ ] Fix the "Generate Image" button — wire it up to the Google AI Studio (Gemini) API key
- [ ] Verify the API key works end-to-end in the demo
- [ ] Be able to show a live demo generating real images to the team

### Merge Nav's Branch
- [ ] Review Nav's pull request (~2,871 changes from his fork)
- [ ] Merge his branch into main once validated
- [ ] Confirm demo runs correctly after merge

---

## PRIORITY 2 — Prepare for Wednesday Presentation

### Template Research & Filtering
- [ ] Research which image templates/styles are actually working on Amazon (not just creative — proven effective)
- [ ] Organize templates by **product subcategory** (e.g., "cup holders" not "automotive interior")
- [ ] Identify the 3-4 core template types per category:
  1. Product floating at different angles
  2. Product zoomed-in / close-up
  3. Product in real environment/usage
  4. Product with accessories
- [ ] Check Amazon compliance — which styles are allowed vs. risky
- [ ] Trim the current template list to reduce customer confusion

### Document the Full Workflow
- [ ] Write up the agreed workflow to present:
  - **Step 1: Main Image** — ASIN input → category detection → pre-filtered templates → generate (with optional upload for realism)
  - **Step 2: Creative Campaign** — Pull product reviews → analyze what customers love/hate → use insights to guide secondary images
  - **Step 3: Secondary Images** — Stepped generation (benefit → features → comparison → lifestyle → social proof) with "Generate All" option
  - **Step 4: Editor** — In-tool editing (remix, restyle, remove, overlay text/logo/CTA)
- [ ] Include UI/UX mockups or flow diagrams if possible

---

## PRIORITY 3 — This Week (Before Thursday Check-in)

### Test Amazon Creative Studio Editor
- [ ] Go through Amazon Creative Studio editor hands-on
- [ ] Evaluate: Is remix/restyle/remove/overlay sufficient for your users?
- [ ] Decide: Can we replicate this or do we need more?
- [ ] Document findings for Thursday check-in with Nav

### Subscription
- [ ] Ask Abdullah to subscribe to Salty Society AI for deeper research on realistic image workflows

### Secondary Image Workflow Design
- [ ] Finalize the stepped/rolling UI approach for secondary images
- [ ] Define what each step generates (benefit infographic, feature infographic, comparison, close-up, lifestyle, social proof)
- [ ] Plan the "Generate All" batch flow
- [ ] Ensure creative campaign review data feeds into secondary image prompts

---

## PRIORITY 4 — Backlog (After Wednesday)

- [ ] Build backend: auto-detect product category from ASIN → fetch top 10-15 Amazon results → extract template patterns
- [ ] Integrate Seller Sprite API for competitor image analysis
- [ ] Implement upload image flow (multi-angle photos for realism)
- [ ] Explore ComfyUI for layered generation (product + background as separate steps)
- [ ] Consider layered downloads (font/product/background as separate files)
- [ ] Video generation from images (future)
- [ ] Deploy to live server (buy hosting/URL)

---

## Key Decisions to Communicate to Team Wednesday

1. Templates pre-filtered by subcategory (less is more)
2. Upload image encouraged but optional (solves AI render-look problem)
3. Editor built in-tool (Amazon Creative Studio as reference)
4. Workflow: Main Image → Reviews/Campaign → Secondary Images
5. Generate multiple versions per step — customer picks the best
6. AI hallucination is a known limit — mitigation is multi-version generation
