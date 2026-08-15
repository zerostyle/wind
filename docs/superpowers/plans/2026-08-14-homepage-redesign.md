# Wind Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved 1440 × 900 observed-first wind dashboard exclusively in `pen/site.pen`.

**Architecture:** Replace the existing imported mobile-width root frame with a purpose-built desktop canvas frame. Use nested Pencil frames for the masthead, asymmetric observed/forecast workspace, and bottom marine/utility band; preserve the existing page’s data as static design content while keeping each evidence source visually distinct.

**Tech Stack:** Pencil `.pen` schema and the pen.dev canvas execution API.

---

### Task 1: Establish the desktop shell

**Files:**
- Modify: `pen/site.pen`

- [ ] Set the existing root frame to `placeholder: true`, resize it to 1440 × 900, and rebuild it with a near-black background, 32-pixel padding, and compact vertical spacing.
- [ ] Add the masthead with location, title, evidence-layer explanation, snapshot time, and source status.
- [ ] Verify the shell bounds with the canvas visitor API.

### Task 2: Build the observed-wind region

**Files:**
- Modify: `pen/site.pen`

- [ ] Add an 824-pixel observed column with the dominant 16.7 kt reading, stale status, average/gust/lull/direction metrics, and adjacent stale-data warning.
- [ ] Recreate the observed chart as a large high-contrast plot using Pencil shapes and paths with explicit view boxes.
- [ ] Verify the observed region’s hierarchy, alignment, contrast, and clipping.

### Task 3: Build the expected-build region

**Files:**
- Modify: `pen/site.pen`

- [ ] Add the 528-pixel forecast column with model-current metadata and a compact 24-hour grid.
- [ ] Preserve every existing hourly speed and gust value while emphasizing the late-afternoon build.
- [ ] Verify that forecast styling remains distinct from observed styling and fits without clipping.

### Task 4: Add marine and utility information

**Files:**
- Modify: `pen/site.pen`

- [ ] Add the shallow bottom band with marine wind outlook, thunderstorm risk, warning status, data sources, and snapshot metadata.
- [ ] Replace the webcam presentation with one “Open live cam on YouTube” external-action button and source label.
- [ ] Remove the root placeholder flag and verify the complete 1440 × 900 frame using bounds checks and a screenshot.

### Task 5: Final canvas review

**Files:**
- Verify: `pen/site.pen`

- [ ] Confirm there are no collapsed, overflowing, or clipped nodes.
- [ ] Confirm observed wind is the dominant region and expected build is visible without scrolling.
- [ ] Confirm text contrast, spacing, alignment, evidence-layer separation, and the single-button YouTube treatment.
