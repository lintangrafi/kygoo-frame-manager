# Frame Catalog & Preview Fixes

## Root Causes Found

### 1. 🔴 Upload files not served (all previews broken)
`src/lib/upload.ts` saves to `./uploads/` (outside `public/`). Next.js only serves static files from `public/`. All `<img src="/uploads/...">` tags 404.

### 2. 🔴 Customer cannot load frames
`GET /api/frames` at `src/app/api/frames/route.ts` requires staff auth (`getStaffSession()`). Customer `Gallery` component calls this endpoint without auth → 401. No frames appear for customers.

### 3. 🟡 No frame preview on edit page
`FrameSlotEditor` renders the frame PNG on canvas using `frameUrl` from DB. Even if the upload path is fixed (Issue 1), the edit page lacks a dedicated image preview `<img>` tag. The canvas re-draws only after upload/file change.

### 4. 🟡 Edit frame page missing controls
`FrameEditClient.tsx` only shows canvas + slot controls. Missing: name edit input, category dropdown, additional fee input, "Simpan Detail" button. The `PUT /api/frames/[id]` endpoint exists but has no UI.

### 5. 🟢 No slot drag/resize
`FrameSlotEditor.tsx` only supports click-to-select. No `onMouseDown`/`onMouseMove`/`onMouseUp` for dragging slots or resizing them.

### 6. 🟢 No /today link in staff dashboard
Staff sidebar has Dashboard, Sesi, Frame — no link to `/today` (customer entry point).

### 7. 🟡 Customer not redirected to design
This is a symptom of Issue 2 — `Gallery` can't load frames, so `handleSelectFrame` never fires. Once API auth is fixed, the redirect to `/s/[slug]/editor/[compId]` should work.

---

## Fixes (in order)

### Fix 1: Change upload directory to `public/uploads`
**File:** `src/lib/upload.ts` (line 6)

Change:
```ts
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
```
To:
```ts
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
```

### Fix 2: Make `GET /api/frames` public
**File:** `src/app/api/frames/route.ts`

Remove the auth check from the `GET` handler only. Keep auth on `POST`.

```ts
export async function GET() {
  const allFrames = await db.select().from(frames).orderBy(frames.createdAt);
  return NextResponse.json(allFrames);
}
```

### Fix 3: Add slot drag and resize to FrameSlotEditor
**File:** `src/components/frames/FrameSlotEditor.tsx`

Add mouse event handlers: `onMouseDown` / `onMouseMove` / `onMouseUp` on the canvas.
- Resize handles: 10px squares at each corner of the selected slot
- Drag: move selected slot by mouse delta
- Resize: drag corner to change width/height

### Fix 4: Add frame detail editing to edit page
**File:** `src/app/(staff)/staff/frames/[id]/FrameEditClient.tsx`

Add sidebar with: name input, category dropdown, additional fee input, "Simpan Detail" button, and frame PNG preview `<img>`.
Call `PUT /api/frames/[id]` on save.

### Fix 5: Add /today link to staff sidebar
**File:** `src/components/layout/Sidebar.tsx`

Add "Pelanggan" nav link with `Users` icon pointing to `/today`. Active when pathname starts with `/today` or `/s/`.

### Fix 6: Add error handling to handleSelectFrame
**File:** `src/components/session/Gallery.tsx`

Add `res.ok` check and alert on failure in `handleSelectFrame`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/upload.ts` | Change default `UPLOAD_DIR` to `./public/uploads` |
| `src/app/api/frames/route.ts` | Remove auth from `GET` handler |
| `src/components/frames/FrameSlotEditor.tsx` | Add drag/resize handlers, resize handle rendering, edit-mode detail controls |
| `src/app/(staff)/staff/frames/[id]/FrameEditClient.tsx` | Pass edit-mode detail callbacks to FrameSlotEditor |
| `src/components/layout/Sidebar.tsx` | Add `/today` nav link |
| `src/components/session/Gallery.tsx` | Add error handling to `handleSelectFrame` |
