# Meeting Summary — Image Gen MVP
**Date:** 2026-02-14
**Participants:** Developer (Nav/YCCHNG) + Product Owner
**Topic:** Image Generation MVP — Workflow Design, Templates, and Next Steps

---

## Overview

The meeting covered the full product workflow for an AI-powered image generation tool targeting Amazon sellers. Key areas discussed: Git collaboration setup, main image generation, secondary image generation, template selection strategy, the realism vs. AI-render problem, editor features, and competitor analysis integration.

---

## Key Discussion Topics

### 1. Git/GitHub Collaboration Setup
- Developer forked the main repo and created a branch with ~2,871 changes
- Branch was published to GitHub during the meeting
- Explained fork → pull request → merge workflow to product owner
- Clarified localhost vs. online deployment (need to buy a server/URL to go live)
- GitHub Issues tab can be used for engineer-to-engineer discussion
- Developer used Claude Code to rebuild demo locally from GitHub codebase

### 2. Main Image Generation Workflow
- Currently using Google AI Studio API key (Gemini) for image generation
- **Priority:** Get the "Generate Image" button actually working
- Current flow: User enters ASIN → chooses category → selects number of images → picks model → selects templates → generates
- **Problem identified:** Too many template options are confusing for customers
- **Decision:** Templates should be filtered/pre-selected based on what actually works on Amazon for the specific product subcategory

### 3. Template Strategy (Major Decision)
- **Agreed:** Not all templates are useful. Showing too many options confuses customers
- **New approach:**
  - Fetch top 10-15 search results from Amazon for the product's subcategory
  - Analyze what image templates/styles the top sellers are using
  - Pre-select only those templates that are proven to work on Amazon
  - Templates should be category-specific (e.g., "cup holders" not just "automotive interior accessories")
- **Common template types identified:**
  1. Product floating at different angles
  2. Product zoomed in / close-up
  3. Product in actual environment/usage scenario
  4. Product with accessories on the side

### 4. Realism vs. AI Render Problem
- **Critical finding:** AI-generated images look "fake" / render-like — this is a major issue for Amazon listings
- Even Amazon's own Creative Studio tool fails to produce realistic-looking product images
- **Salty Society's recommendation:** Use real phone photos from multiple angles as input to avoid AI render look
- **Decision:** Upload image feature should be offered (preferably encouraged but skippable)
  - Customers upload real product photos from different angles
  - AI uses these as base to maintain realism
  - Customers who skip will get more render-looking results (some may not mind)
- Real photos with scale references (e.g., "600mm") help products look more realistic
- Could potentially use upload image as an upsell feature

### 5. Secondary Image Generation
- Image types needed: Infographic, key features/benefits, lifestyle, close-up detail shots, comparison, social proof
- Developer already created an MD file describing what should be in secondary images with compliance guidelines
- **Workflow decision:**
  - Instead of separate column options, use a rolling/stepped approach
  - Step 1: Generate benefit infographic
  - Step 2: Feature infographic
  - Step 3: Comparison, etc.
  - User can click "Generate All" to batch-generate everything
  - Users pick the best from multiple generated options per step

### 6. Editor Features
- **Agreed:** In-tool editing is a must (users shouldn't need to go to Photoshop)
- Reviewed Amazon Creative Studio's editor as reference:
  - Remix (describe changes via prompt)
  - Restyle (change visual style, e.g., "autumn")
  - Remove (draw selection to remove elements)
  - Reframe (crop differently)
  - Overlay (add text, logo, call-to-action)
- **Decision:** Stick with Amazon-style editor design for secondary images
  - Add logo, text, CTA overlays
  - Remix to adjust elements
  - Insert transparent-background product images to fix placement issues
- ComfyUI was explored as a more powerful alternative but deemed too complex for now

### 7. Creative Campaigns Module
- Collects and analyzes product reviews to understand what customers love/hate
- Used to generate better prompts for secondary images
- **Workflow position:** After main image, before secondary image generation
  - Step 1: Main image
  - Step 2: Creative campaign (review analysis)
  - Step 3: Secondary images (informed by review insights)

### 8. Competitor Analysis
- Feature to show competitor images using Seller Sprite API
- Shows what top competitors' listings look like
- Helpful for guiding template/style choices
- **Placement:** Show alongside image generation results

### 9. AI Limitations Acknowledged
- AI "hallucinations" in product images (creates features that don't exist)
- Cup holder example: AI couldn't correctly place/render the product in use
- Even Amazon's tool has this problem
- **Mitigation:** Generate multiple versions, let customer pick the best one
- Translation features not useful yet (can't capture market-specific keywords)

---

## Action Items (Organized by Priority & Owner)

### Developer (Nav) — Immediate (Before Next Wednesday)

**Step 1: Fix Core Functionality**
- [ ] Fix the "Generate Image" button so it actually generates images using the Google AI Studio (Gemini) API key
- [ ] Ensure the API key works in the demo
- [ ] Submit a pull request for the working changes

**Step 2: Secondary Image Workflow**
- [ ] Design and implement the secondary image generation workflow
  - Stepped/rolling UI (benefit → features → comparison → etc.)
  - "Generate All" batch option
  - Multiple versions per step for customer to choose from
- [ ] Integrate editor functionality (Amazon Creative Studio style)
  - Remix, restyle, remove, overlay (text/logo/CTA)

**Step 3: Git Housekeeping**
- [ ] Figure out how to properly merge branches
- [ ] Create pull request to product owner's repo

### Product Owner — Immediate (Before Next Wednesday)

**Step 1: Template Research**
- [ ] Research and identify which image templates/styles are actually working on Amazon
- [ ] Organize templates by product subcategory (not broad category)
- [ ] Determine which templates are compliant with Amazon guidelines
- [ ] Narrow down template options to reduce customer confusion

**Step 2: Editor Evaluation**
- [ ] Test Amazon Creative Studio's editor to assess if its capabilities are sufficient
- [ ] Report back on whether the editor approach works for their use case

**Step 3: Subscription**
- [ ] Ask Abdullah to subscribe to "Salty Society AI" (or similar tool) for further research

### Joint — For Next Wednesday's Team Presentation

**Step 1: Demo Preparation**
- [ ] Show the team that the tool can actually generate images (working demo)
- [ ] Present the agreed main image workflow
- [ ] Present the secondary image workflow (including editor)

**Step 2: Document the Workflow**
- [ ] Developer writes down the complete workflow document covering:
  - Main image generation process (with upload image option)
  - Template selection logic (category-based, Amazon-validated)
  - Creative campaign / review analysis step
  - Secondary image generation process (stepped approach)
  - Editor capabilities and limitations
- [ ] Include UI/UX considerations

### Backlog / Future Considerations

- [ ] Build backend logic to detect product category from ASIN and auto-fetch Amazon search results
- [ ] Implement competitor analysis feature (Seller Sprite API integration)
- [ ] Explore ComfyUI for advanced layered image generation (two-step: product + background merge)
- [ ] Investigate how to make AI images look more realistic (upload image workflow refinement)
- [ ] Consider providing layered downloads (separate font, product, background layers) for Photoshop users
- [ ] Video generation from images (Amazon Creative Studio has this — future feature)
- [ ] Translation/localization (currently not reliable for keyword accuracy)
- [ ] Deploy to online server (buy URL/hosting) for public access

---

## Key Decisions Made

1. **Templates will be pre-filtered** by product subcategory based on what works on Amazon
2. **Upload image is strongly encouraged** but optional (key to avoiding AI render look)
3. **Editor is a must-have** — using Amazon Creative Studio as the design reference
4. **Workflow order:** Main Image → Creative Campaign (reviews) → Secondary Images
5. **Multiple versions generated** per step so customers can pick the best
6. **ComfyUI is too complex** for now — stick with simpler approach
7. **Number of images = number of templates selected** (not a separate multiplier)

---

## Next Meeting
- **Thursday** (developer + product owner check-in)
- **Next Wednesday** — Team presentation with working demo
