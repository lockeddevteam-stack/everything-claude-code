### F-BUDG-001 — Weekly budget target
- location: Shop & Budget > Budget > "WEEKLY BUDGET" card > Edit
- user action: taps Edit, types a number, taps Save
- behaviour: `saveTarget` parses a float; `NaN` or negative shows the toast "Enter a weekly budget of 0 or more." and keeps the editor open (v6:44025-44030); otherwise merges `weeklyTarget` into `budgetData` and closes (v6:44031-44036).
- v6 status: WORKING — evidence v6:44026-44029.

### F-BUDG-002 — Weekly spend meter
- location: Shop & Budget > Budget > "WEEKLY BUDGET" card
- user action: 
- behaviour: 1. Week window = current Sunday 00:00 → +7 days (v6:44005-44011). 2. `weekSpent = Σ h.total` over that window (v6:44016-44018). 3. `pct = min(weekSpent / weeklyTarget * 100, 100)`; `overBudget = target > 0 && weekSpent > target` (v6:44019-44020). 4. Big figure `$weekSpent` turns red when over; subtitle is "of $target" or "No target set" (v6:44446-44462). 5. Bar colour: red gradient when over, amber above 75 %, green otherwise (v6:44474-44476). 6. Footer shows "$X over budget" or "$X remaining", plus "`N`%" (v6:44487-44503).
- v6 status: WORKING — evidence v6:44474-44497.

### F-BUDG-003 — Month + purchase-count tiles
- location: Shop & Budget > Budget > "THIS MONTH" / "PURCHASES" tiles
- user action: 
- behaviour: `monthSpent` = Σ totals of history entries dated ≥ the 1st of the current month (v6:44021-44024); "PURCHASES" shows `thisWeek.length` — a **week** count sitting next to a **month** figure (v6:44543).
- v6 status: PARTIAL — evidence v6:44543 `thisWeek.length` under a card whose sibling is monthly; the tile is unlabelled as to period.

### F-BUDG-004 — Log a purchase manually
- location: Shop & Budget > Budget > "+ Add Purchase" → "LOG PURCHASE" form
- user action: item name, price, qty, store select, "Add to History"
- behaviour: 1. Missing name or unparseable price → toast "Give the purchase a name and a price." (v6:44041-44044). 2. Builds `{id:"p_"+Date.now(), items:[{name,price,qty}], store: addStore || "Unknown", date, total: price*qty, source:"manual"}` (v6:44045-44056). 3. Prepends to `history`, persists, clears the form and closes it (v6:44057-44065).
- v6 status: WORKING — evidence v6:44045-44060.

### F-BUDG-005 — Receipt scan (camera or library) → `/parse-receipt`
- location: Shop & Budget > Budget > "SCAN RECEIPT" tile > Camera / Library
- user action: taps Camera (`capture="environment"`) or Library, picks an image
- behaviour: 1. Two hidden `<input type="file" accept="image/*">`, one with `capture="environment"` (v6:44643-44661). 2. `handleReceiptPhoto` sets `receiptLoading`, clears the input value so the same file can be re-picked (v6:44068-44072). 3. `FileReader.readAsDataURL`; splits the data URL into `rawB64` (v6:44073-44077). 4. POST `https://lockedapi.cescocugliari.workers.dev/parse-receipt`, `Content-Type: application/json`, body `{base64: <full data URL>, image: <bare base64>, mime}` — the image is sent **twice** in two encodings (v6:44078-44090). 5. Non-2xx throws `HTTP <status>` (v6:44091). 6. `extractReceiptJson(d)` normalises the response (see "Receipt parsing"). 7. On `success`: each item is coerced to `{name: it.name||it.item||"Item", price: parseFloat(it.price||it.cost||0)||0, qty: parseFloat(it.qty||it.quantity||1)||1, category: it.category||""}` (v6:44099-44107); a missing total is recomputed as `Σ price*qty` (v6:44108-44113); total is rounded to cents; store defaults to "Unknown" (v6:44114-44115); result goes into `pendingReceipt`. 8. `ocr_failure` → pending receipt carrying "No items detected. Try a clearer, well-lit photo of the entire receipt." (v6:44117-44124). 9. `backend_error` → "Receipt service temporarily unavailable. Please try again." (v6:44125-44131). 10. Any other status → "Could not process receipt. Try again." (v6:44132-44138). 11. `.catch` → "Scan failed: `<message>`. Try again." (v6:44140-44148). 12. `reader.onerror` → "Could not read image file." (v6:44149-44157).
- v6 status: UNVERIFIED - Evidence: v6:44078 the endpoint is called unconditionally, but the worker's contract is not in this file. Confirm with a real POST carrying a receipt image.

### F-BUDG-006 — Confirm receipt → history + pantry
- location: Shop & Budget > Budget > "CONFIRM RECEIPT" card
- user action: optionally picks a store from the dropdown, taps "Confirm & Save" (or "Cancel")
- behaviour: 1. The card lists each item as "`qty`x `name`" with "$price" and a Total row (v6:44827-44875). 2. A store `<select>` seeded with `receiptStore || pendingReceipt.store`, options = "Unknown store" + enabled stores (v6:44805-44826). 3. `confirmReceipt` resolves the store, recomputes a fallback total, builds `{id:"r_"+Date.now(), items, store, date, total: pendingReceipt.total || computed, source:"receipt"}` and prepends it to history (v6:44242-44259). 4. Calls `addToPantry(items, store)` (v6:44260) — F-SHOP-032. 5. Clears `pendingReceipt` and `receiptStore` (v6:44261-44262). 6. Cancel just clears `pendingReceipt` (v6:44880-44882). 7. When `pendingReceipt.error` is set, only the error text and Cancel render — "Confirm & Save" is hidden (v6:44790-44795, v6:44896).
- v6 status: WORKING — evidence v6:44250-44260.

### F-BUDG-007 — Import checked shopping-list items as a pending purchase — DEAD
- location: none — no UI renders it - Behavior (as written): takes `checked` shopping-list items, maps them to `{name, price:0, qty}`, builds `{id:"sl_"+Date.now(), items, store:"Shopping List", date, total:0, source:"shopping_list", needsPrices:true}` and appends it to `data.pendingItems` (v6:44264-44289).
- user action: 
- behaviour: 
- v6 status: DEAD - Evidence: `grep -n "importCheckedItems"` matches only its definition at v6:44264 — no call site anywhere in the 58k-line file. `pendingItems` is likewise only initialised (v6:43968) and appended here (v6:44286); it is never rendered or read.

### F-BUDG-008 — Smart Savings — AI cheaper swaps (bare-root AI call)
- location: Shop & Budget > Budget > "SMART SAVINGS" > "Find Cheaper Swaps"
- user action: taps the link (card only renders when `thisWeek.length > 0`, v6:44911)
- behaviour: 1. Returns immediately if the week is empty (v6:44291). 2. Builds `recentItems` = for every this-week item with `price > 0`, the string `"<name> ($<price> at <store|unknown>)"` (v6:44293-44299). 3. Builds `storeNames` = enabled stores as `"Name (description)"` joined by ", " (v6:44300-44302). 4. POST `https://lockedapi.cescocugliari.workers.dev/` with `{system, messages:[{role:"user",content}], max_tokens:500}` (v6:44303-44317). - system: "You are a budget grocery advisor. The user shops at: `<storeNames>`. Suggest cheaper alternatives for their recent purchases. For each swap, name the specific cheaper product and which store. Return ONLY a JSON array: [{\"original\":…,\"swap\":…,\"store\":…,\"savings\":\"$X.XX\"}]. Max 6 swaps. No explanation, raw JSON array only." (v6:44306) - user: "My recent purchases:\n`<lines>`\n\nMy weekly budget: $`<target|not set>`. I've spent $`<weekSpent>` this week. Suggest cheaper swaps." (v6:44308-44310) 5. Response: `d.content[0].text || "[]"`, first `[...]` block `JSON.parse`d; parse failure → `setSwaps([])` (v6:44318-44328). 6. `.catch` → `setSwaps(null)` (explicitly *not* `[]`) plus the toast "Couldn't check for swaps. Check your connection and try again." (v6:44329-44333). 7. Renders each swap as struck-through original / "save $X" / bold swap / orange store (v6:44946-44984). `swaps.length === 0` renders "No cheaper alternatives found. You're already shopping smart!" (v6:44985-44990).
- v6 status: UNVERIFIED - Evidence: v6:44303 posts to the worker root; nothing in this file establishes the route's behaviour. Confirm with a POST to the root URL.

### F-BUDG-009 — Price comparison across stores (bare-root AI call)
- location: Shop & Budget > Budget > "PRICE COMPARISON" card (renders only when `myStores.length >= 2`, v6:44899)
- user action: types an item, taps Compare or presses Enter
- behaviour: 1. Returns if the input is blank or fewer than 2 enabled stores (v6:44335). 2. POST to the worker root with `{system, messages, max_tokens:400}` (v6:44341-44355). - system: "You are a grocery price comparison expert. Compare prices of a product across stores. Return ONLY a JSON array sorted cheapest first: [{\"store\":…,\"product\":…,\"price\":\"$X.XX\",\"note\":…}]. Use realistic prices for each store. No explanation, raw JSON array only." (v6:44344) - user: "Compare prices for \"`<item>`\" across these stores: `<storeNames>`" (v6:44346) 3. Same `content[0].text` → first `[...]` → `JSON.parse` extraction; failure → `[]` (v6:44356-44365). 4. `.catch` → `setCompareResults(null)` + toast "Couldn't compare prices. Check your connection and try again." (v6:44366-44369). 5. Row 0 is highlighted green with a "BEST" badge (v6:44779-44787 style, badge v6:44790).
- v6 status: UNVERIFIED — evidence v6:44341; endpoint contract unproven.

### F-BUDG-010 — Purchase history with week / month / all / receipts filters
- location: Shop & Budget > Budget > "HISTORY" card
- user action: taps Week / Month / All / 🧾 Receipts
- behaviour: 1. `filteredHistory` = `thisWeek`, `thisMonth`, all history, or `history.filter(source === "receipt")` (v6:44376-44380). 2. Each entry renders store name, a source badge RECEIPT / LIST / MANUAL, `$total`, a delete "x", and the date as "Mon, Jan 5" (v6:44975-45010). 3. Item lines: all items in the receipts view, otherwise the first 3 (v6:45011-45023). 4. Outside the receipts view, entries with > 3 items append a "`N` items" line (v6:45024-45031).
- v6 status: PARTIAL - Evidence: v6:45024-45031 — the overflow line prints the *total* item count ("7 items"), not the remainder, directly under 3 already-listed items, so it reads as a contradiction.
