## Context

The slip Shortcut already sends `{ ts, text, album }` per photo. The photo never leaves the phone, and the board is a static web app that cannot read the iOS Photos library.

## Decisions

### 1. Store a pointer, not the image
Uploading images would need Storage, RLS on buckets and retention decisions, and would put bank slips (account numbers, names) on a server. Storing the photo's timestamp is enough for the same device to find it again, and keeps slips off the server.

### 2. Open via a companion Shortcut, not a Photos deep link
iOS exposes no URL scheme for a specific Photos asset (`photos-redirect://` only opens the app). `shortcuts://run-shortcut?name=…&input=text&text=…` can run a user-owned Shortcut with the timestamp as input; that Shortcut does Find Photos → Quick Look. The Shortcut name is the constant `SLIP_VIEWER_SHORTCUT` ("Open Slip").

### 3. `ts` is stored verbatim
The Shortcut loop already produces `ts` for each photo, so the same string can be handed back to Find Photos. Parsing it to a date (as the existing `date` fallback does) would lose precision. Trade-off: how exactly "Date Created" can match depends on the Shortcut's formatting; the user may need a one-second window filter.

### 4. iOS-only, detected after mount
The link is rendered only when `isIosDevice(userAgent, maxTouchPoints)` (iPhone/iPad/iPod, plus iPadOS reporting as Macintosh with touch). Detection runs in `useEffect` so the statically exported HTML and hydration match. This hides a button that could never work on desktop/Android; it does not prove the photo is on *this* iPhone — if it isn't, the Shortcut finds nothing.

### 5. Edits never touch `slip_ref`
Like `source`, `slip_ref` is set only at insert by the edge function; the board's edit flow omits it, so reviewing a row keeps its link. `Transaction.slip_ref` is optional so manual and imported rows need no change.

### 6. Per-device matching by name
A user with several iOS devices must only see the button on the one holding the photo. A web page can't read the device name or Photos contents, so the Shortcut sends its "Device Name" as `device` (stored as `slip_device`) and the user types the same name once on each device (`useDeviceName`, `localStorage` `msb_device_name`). `slipLinkAvailable` compares them after NFKC/curly-quote/whitespace/case normalisation. Rows without a `slip_device` (uploaded before this change) keep the old behaviour: offered on any iOS device. A device-tagged row on a device with no name entered shows no button. Renaming a device makes older rows stop matching; accepted for simplicity over a generated device ID.
