# QuoteCraft Mobile Flow: Micro-interaction Register

> **Standard:** Purposeful, sub-400ms micro-interactions engineered for non-technical marine suppliers on mid-range mobile devices (360px–430px).  
> **Status:** Phase 0 / Register Definition — **Awaiting User Approval** before implementation passes.

---

## 1. Principles & Hard Constraints

1. **One Purpose Per Interaction:** Every micro-interaction must fulfill exactly one of these roles:
   - Confirm an action
   - Show live operational status
   - Prevent an expensive commercial error
   - Guide the next physical step
   - Reduce perceived latency
   - Mark quotation completion (once per flow on Success).
2. **Real Data Only:** Zero fabricated counts, fake progress bars, or simulated "AI thinking". Real byte progress or deterministic staged updates only.
3. **Never Block Input:** Every animation completes in $\le 400\text{ms}$ (continuous loops restricted strictly to loading spinners and skeletons) and is immediately interruptible.
4. **Transform & Opacity Only:** 0 Layout Shift ($\text{CLS} < 0.1$), 60fps on throttled CPUs, hardware accelerated via GPU layer compositing.
5. **Universal Accessibility:** Comprehensive `prefers-reduced-motion` fallbacks, keyboard-reachable undo, and explicit `aria-live` politeness settings.

---

## 2. Motion & Interaction Tokens

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `motion-instant` | `80ms` | Immediate feedback (checkboxes, toggle switches, active taps) |
| `motion-fast` | `120ms` | Button press scale, chip dismissals, cursor focus |
| `motion-base` | `200ms` | Slide-overs, accordion expansions, error shakes, badge fades |
| `motion-slow` | `400ms` | Staggered entries, number count-ups, stage completion checks |
| `motion-success` | `1200ms` | One-time celebration confetti + stroke draw on Success screen |
| `ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Natural deceleration for incoming UI elements |
| `ease-overshoot` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Tactile spring pop for success checkmarks |
| `haptic-tick` | `8ms` | Subtle tap confirmation (e.g. quantity stepper, checkbox) |
| `haptic-success` | `[10, 40, 10]` | Multi-pulse pattern for extraction and download completion |
| `haptic-warning` | `[20, 40, 20]` | Double buzz on invalid file, zero price, or duplicate |
| `haptic-error` | `[30, 50, 30]` | Heavy pattern for network failure or hard abort |

---

## 3. The Complete Micro-interaction Register

| ID | Screen | Trigger | Feedback | Duration & Easing | Reduced-Motion Alternative | Accessibility (a11y) | Test Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`MI-GL-01`** | **Global** | Touch down on any button/interactive target | Scale `.98` + subtle opacity shift; 0ms tap delay | `120ms` `ease-out` | Instant opacity change (`0.8`), no scale | Focus ring remains visible; `:active` state | Playwright: touch event triggers `.pressable` transform |
| **`MI-GL-02`** | **Global** | Keyboard `Tab` / Virtual keyboard focus | 2px brand teal ring with 2px offset | Instant (`0ms`) | Identical (always visible) | WCAG 2.4.7 Focus Visible ($>3:1$ contrast) | Verify `document.activeElement` outline style |
| **`MI-GL-03`** | **Global** | Navigation to Step 1, 2, or 3 | Slide 250ms (forward from right, back from left) via View Transitions API | `250ms` `ease-out` | Instant crossfade (`100ms`) | Auto-scroll to top; focus moves to screen H1 | View Transition API fallback test; H1 focus assert |
| **`MI-GL-04`** | **Global** | User scrolls $>4\text{px}$ down | Sticky AppBar subtle elevation shadow (`shadow-xs`) fades in | `150ms` `ease-out` | Instant shadow toggle | Visual depth only, no layout shift | Scroll position assert vs header shadow class |
| **`MI-GL-05`** | **Global** | Device loses internet connection | Amber offline banner slides down from top (`"Working offline. Draft saved locally."`) | `200ms` `ease-out` | Instant appearance | `role="status"` `aria-live="polite"` | Network toggle event; assert banner text |
| **`MI-GL-06`** | **Global** | Device regains internet connection | Green `"Back online. Ready to dispatch."` toast appears for 2s then slides up | `200ms` in, `2000ms` hold | Instant toggle | `role="status"` `aria-live="polite"` | Offline to online transition event test |
| **`MI-GL-07`** | **Global** | Destructive action (Item delete, draft reset) | Bottom toast appears with prominent `Undo` button; active for 5s; pauses on hover/focus | `200ms` in, `5000ms` duration | Instant appearance, no slide | Focusable `Undo` button via keyboard; `role="alert"` | Click Delete $\to$ click Undo within 4s $\to$ assert item restored |
| **`MI-UP-01`** | **Upload** | Tap between `Upload` and `Paste Text` tabs | Active selection background pill slides horizontally across the track | `200ms` `ease-out` | Instant tab switch | `role="tab"` `aria-selected="true"` | Click tab $\to$ assert transform/classes |
| **`MI-UP-02`** | **Upload** | User drags file over dropzone | Border turns solid teal `#347A72`, background shifts to light mint, cloud icon translates up $4\text{px}$ | `150ms` `ease-out` | Instant border color change, no translation | Visual affordance for pointer drop | Dragenter event test; assert border/bg classes |
| **`MI-UP-03`** | **Upload** | Valid file selected (PDF/Excel) | Haptic tick (`8ms`); dropzone collapses into File Info Chip (icon, name, size, remove X) | `200ms` `ease-out` | Instant card replace | `"Selected file: [name], [size] ready"` announced | File upload input change $\to$ assert file chip visible |
| **`MI-UP-04`** | **Upload** | Invalid file format or $>10\text{MB}$ | 200ms horizontal shake + warning haptic `[20,40,20]` + clear error box | `200ms` `ease-out` | Red border + instant message, no shake | `role="alert"` `"File exceeds 10MB. Please upload smaller file."` | Upload `.exe` or 15MB file $\to$ assert `.animate-shake` & alert |
| **`MI-UP-05`** | **Upload** | Typing/pasting text into Requisition box | Textarea auto-grows to content; live line counter updates (`"12 lines detected"`) | Instant | Instant | Subtitle updates; no layout jump | Type 5 lines $\to$ assert counter text `5 lines detected` |
| **`MI-UP-06`** | **Upload** | Tap `"Paste from clipboard"` button | Reads clipboard; text inserted; haptic tick; primary extract button illuminates | `120ms` | Instant | `aria-label="Paste enquiry from clipboard"` | Mock navigator.clipboard.readText $\to$ assert filled value |
| **`MI-PR-01`** | **Processing** | Stage transition (`Reading file` $\to$ `Finding items` $\to$ `Checking details`) | Active stage displays spinner + bold text; completed stage draws green check icon stroke | `250ms` draw stroke | Instant icon swap to static checkmark | `aria-live="polite"` announces: `"Step: Finding items"` | Mock staged extraction $\to$ assert checkmark SVG stroke |
| **`MI-PR-02`** | **Processing** | Ingestion start | Acquire Screen Wake Lock via `navigator.wakeLock` to prevent screen timeout | Instant | Same | None (transparent utility) | Assert wakeLock sentinel created and released on finish |
| **`MI-PR-03`** | **Processing** | User taps `Cancel` during processing | Aborts fetch immediately; shows toast `"Cancelled. Your file wasn't saved."` | `100ms` | Instant | `role="status"` `aria-live="polite"` | Click Cancel during upload $\to$ assert abort signal & toast |
| **`MI-RV-01`** | **Review** | Page entry with extracted items | First 6 item cards stagger in ($30\text{ms}$ delay between cards, $8\text{px}$ translate up + fade) | `200ms` per card | Instant static display (all cards visible immediately) | Focus moves to `"Review Items, Step 2 of 3"` | Render Step 2 $\to$ check animation delay cascading |
| **`MI-RV-02`** | **Review** | Summary numbers arrival | Items count counts up from 0 to total over 400ms using tabular numbers | `400ms` `ease-out` | Static count rendered immediately | Final number announced to screen reader | Assert count-up hook reaches target number |
| **`MI-RV-03`** | **Review** | Needs Review items present | Amber `"Needs Review (X)"` badge scales up to $1.12\times$ and settles once; never loops | `400ms` `ease-overshoot` | Static amber badge without pulse | `aria-label="3 items need your review"` | Assert badge has `.animate-pulse-once` class on mount |
| **`MI-RV-04`** | **Review** | Tap quantity stepper `[+]` or `[-]` | Value updates optimistically; button scales `.95`; haptic tick (`8ms`); value never $<1$ | `80ms` | Instant numeric update | `aria-valuenow` on quantity input | Tap `+` 3 times $\to$ assert value equals 4; assert min=1 |
| **`MI-RV-05`** | **Review** | Long press quantity stepper | Value repeats and accelerates after 350ms hold (1 unit $\to$ 5 units $\to$ 10 units) | Accelerating interval | Long press increments by 1 step | Continuous numeric update | Pointerdown hold $\to$ advance timer $\to$ assert accelerated value |
| **`MI-RV-06`** | **Review** | Tap `Jump to check` | Smooth scrolls next review item to viewport center; highlights row border for 800ms | `300ms` scroll, `800ms` highlight | Instant jump without smooth scroll, static border | Auto-focus on the review item's prompt | Click Jump $\to$ verify item scrolled into view & highlighted |
| **`MI-RV-07`** | **Review** | Tap `Review` badge on flagged item | BottomSheet opens showing exact reason + raw RFQ snippet with flagged words highlighted | `200ms` slide up | Instant sheet open | Dialog with `aria-labelledby`; ESC closes | Click flagged badge $\to$ assert BottomSheet with snippet |
| **`MI-RV-08`** | **Review** | Swipe left on card / Click Delete | Row collapses vertically to 0 height ($200\text{ms}$); Toast appears with `Undo` button | `200ms` collapse | Instant row removal | `"Item deleted. Press Ctrl+Z or tap Undo to restore."` | Click Delete $\to$ assert item absent; click Undo $\to$ restored |
| **`MI-RV-09`** | **Review** | Search query typed in filter | 150ms debounce; matching text in names/part numbers highlighted with subtle gold | `150ms` debounce | Instant match | Polite live region: `"[X] items match your search"` | Type query $\to$ assert highlight `<mark>` tags rendered |
| **`MI-PC-01`** | **Pricing** | Tap Unit Price input | Displays numeric decimal keypad (`inputmode="decimal"`); focused input auto-scrolls above keypad | `200ms` | Instant scroll | `aria-label="Unit price for [item name]"` | Focus input $\to$ assert inputmode attribute and focus |
| **`MI-PC-02`** | **Pricing** | Press `Next` / `Enter` on keyboard | Commits current price (formats to 2 decimals); focuses next price input down list | `120ms` | Instant focus shift | Focus moves to next input | Press Enter on price input $\to$ assert next price focused |
| **`MI-PC-03`** | **Pricing** | Price change commits | Line total and Grand Total roll to new number in tabular numerals; mint flash for 600ms | `200ms` roll, `600ms` flash | Instant total change without background flash | Live region announces new Grand Total | Change price from 100 to 200 $\to$ assert `.animate-flash-mint` |
| **`MI-PC-04`** | **Pricing** | Multi-line prices pasted from Excel | Sequential prices assigned down list; toast `"Filled [X] prices. Undo"` appears; mint flash | `300ms` flash | Instant paste assignment | `"12 unit prices populated from clipboard"` | Paste `10\n20\n30` into row 1 $\to$ assert rows 1, 2, 3 updated |
| **`MI-PC-05`** | **Pricing** | Negative number or invalid input | Input rejected; input box shakes ($200\text{ms}$); inline hint `"Price must be 0 or greater"` | `200ms` `ease-out` | Red border + text, no shake | `role="alert"` `"Price cannot be negative"` | Input `-5` $\to$ assert value sanitized and shake fired |
| **`MI-PC-06`** | **Pricing** | Unpriced item jump chip | Chip in sticky bottom bar `"2 need prices"` jumps to next $0 price and outlines input | `250ms` scroll | Instant jump | Focus shifts directly to unpriced input | Click chip $\to$ assert $0 price input received focus |
| **`MI-PC-07`** | **Pricing** | Toggle Additional Charges accordion | Container height animates smoothly ($200\text{ms}$); chevron rotates $180^\circ$ | `200ms` `ease-out` | Instant expand/collapse, static icon | `aria-expanded="true"` / `"false"` | Click accordion header $\to$ assert expanded state |
| **`MI-PV-01`** | **Preview** | PDF rendering in progress | Shimmer skeleton displayed (looping pulse); document fades in over 200ms once ready | `200ms` fade-in | Instant display upon render | `"Generating document preview..."` $\to$ `"Preview ready"` | Fast render toggle $\to$ assert skeleton unmounted |
| **`MI-PV-02`** | **Preview** | Double-tap PDF preview | Toggles between fit-to-width ($100\%$) and enlarged inspection ($200\%$) | `200ms` `ease-out` | Instant zoom level toggle | Zoom level announced to assistive tech | Double tap canvas $\to$ assert scale transform altered |
| **`MI-PV-03`** | **Preview** | Tap `Download PDF` | Button label morphs: `Download PDF` $\to$ `Creating PDF...` (with spinner) $\to$ `Downloaded ✓` (1.2s) | `1200ms` hold | Instant text changes without morph | `aria-busy="true"` during generation | Click Download $\to$ assert label progression $\to$ Success |
| **`MI-SC-01`** | **Success** | Quotation dispatch completion | Green circle stroke draws in ($400\text{ms}$) + overshoot pop; confetti bursts once ($1.2\text{s}$); haptic success | `400ms` stroke, `1200ms` confetti | Static green checkmark, zero confetti | Focus moves to H1: `"Quotation [No] saved to your Quotes"` | Assert canvas confetti fires once and unmounts |
| **`MI-SC-02`** | **Success** | Tap `Send via WhatsApp` | Label updates to `"Opening WhatsApp..."`; phone executes deep link; returns cleanly | `200ms` | Instant text change | Screen reader announces WhatsApp launch | Click WhatsApp $\to$ verify `wa.me` URI called |
| **`MI-SC-03`** | **Success** | Tap `Copy Summary` | Button morphs to `"Copied ✓"` with green checkmark for 1.5s; toast confirms | `1500ms` hold | Instant text change | `"Quotation summary copied to clipboard"` | Click Copy $\to$ verify clipboard text & copied state |

---

## 4. Self-Review: Purposefulness & What Was Cut

To enforce Rule 2 (*"Every micro-interaction must do exactly one job... If it does none of these, do not build it"*), every candidate interaction was subjected to the two-question test:
1. **What does the user now know that they didn't know before?**
2. **What costly mistake does this prevent?**

### The Cut Log (Omitted / Rejected Interactions)
| Proposed Interaction | Why It Was Cut | Rule Violation |
| :--- | :--- | :--- |
| **Simulated AI Scanning Radar / Pulse** | Fake progress. The AI takes 2–4s; artificial scanning radar waves deceive the user and provide zero diagnostic value. | **Rule 3:** Real data only. No fake AI thinking. |
| **Card Parallax on Device Tilt** | Pure visual gimmick. Causes motion sickness in shipyard/quay environments and consumes battery on budget Android devices. | **Rule 5:** Transform and opacity only. No parallax. |
| **Continuous Looping Badge Glow** | Distracting. A marine supplier looking at 20 items gets fatigued by pulsing animations. | **Rule 4 & Guideline:** Badge pulses once on arrival, never loops. |
| **Sound Effects (Chimes on Done)** | Marine chandlers operate in noisy shipyard docks, office calls, or ship bridges where device sounds are inappropriate. | **Rule 5:** No sound, no audio cues. |
| **Multi-page 3D Page Flip in PDF** | Heavy layout shifts, high GPU cost on budget phones, slows down document scanning. | **Rule 5 & 7:** Vector fit-to-width scroll with instant page chip. |
| **Draggable Floating WhatsApp Bubble** | Blocks screen real estate and clashes with sticky bottom primary action bars. | **Rule 2:** Clutters thumb zone; centralized into Share BottomSheet. |

---

## 5. Next Steps

As strictly mandated:
- **Pass 1:** Shared hooks (`useReducedMotion`, `useHaptics`, `useCountUp`, `useToast`, `useWakeLock`) & feedback tokens (press, focus, validation, save status, offline banner).
- **Pass 2:** Flow continuity (View Transitions, staggered row entry, jump-to highlighting, swipe delete + undo collapse, accelerated stepper).
- **Pass 3:** Single delight moment on Success screen (SVG stroke draw checkmark, confetti once, action morphs).

**STOPPING HERE FOR USER APPROVAL** before executing Pass 1.

