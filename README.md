# fivem-nui-react

React hooks and utilities for FiveM NUI development.

## Installation

```bash
npm install fivem-nui-react
```

## Features

```tsx
// Listen for NUI messages from FiveM client
useNuiEvent("eventName", (data) => {});

// Send request and get response
const data = await fetchNui("eventName", { payload });

// Hook with loading/error states and callback
const [fetch, { loading, error }] = useNuiCallback("eventName", (data) => {});

// Send data without expecting response
const [send, { loading, error }] = useSendNui("eventName");

// Check if running in browser (debug mode)
if (isEnvBrowser()) {}
```

```lua
-- Send message from FiveM client to UI
SendNUIMessage({ action = "eventName", data = { key = "value" } })

-- Register callback for UI requests
RegisterNUICallback("eventName", function(data, cb)
  cb({ response = "data" })
end)
```

## API

### useNuiEvent

Listen for NUI messages sent from FiveM client.

```tsx
useNuiEvent<T>(
  action: string,
  handler: (data: T) => void,
  options?: { mockData?: T; mockDelay?: number }
): void
```

**Example:**

```tsx
import { useNuiEvent } from "fivem-nui-react";

function App() {
  const [visible, setVisible] = useState(false);

  useNuiEvent<{ show: boolean }>(
    "toggleUI",
    (data) => setVisible(data.show),
    { mockData: { show: true }, mockDelay: 1000 }
  );

  return visible ? <div>UI Content</div> : null;
}
```

**FiveM Client (Lua):**

```lua
SendNUIMessage({
  action = "toggleUI",
  data = { show = true }
})
```

---

### fetchNui

Send a request to the FiveM client and receive a response.

```tsx
fetchNui<T, D>(
  eventName: string,
  data?: D,
  options?: { mockData?: T; mockDelay?: number }
): Promise<T>
```

**Example:**

```tsx
import { fetchNui } from "fivem-nui-react";

const player = await fetchNui<PlayerData>("getPlayerData", { id: 1 }, {
  mockData: { name: "John", level: 10 },
  mockDelay: 500
});
```

**FiveM Client (Lua):**

```lua
RegisterNUICallback("getPlayerData", function(data, cb)
  local playerId = data.id
  cb({ name = "John", level = 10 })
end)
```

---

### useNuiCallback

Hook for NUI requests with loading/error states. Calls the callback with response data.

```tsx
useNuiCallback<T, D>(
  eventName: string,
  callback: (data: T) => void,
  options?: { mockData?: T; mockDelay?: number }
): [(data?: D) => Promise<T>, { loading: boolean; error: Error | null }]
```

**Example:**

```tsx
import { useNuiCallback } from "fivem-nui-react";

function PlayerInfo() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  const [fetchPlayer, { loading, error }] = useNuiCallback<PlayerData>(
    "getPlayerData",
    (data) => setPlayer(data),
    { mockData: { name: "John", level: 10 }, mockDelay: 500 }
  );

  useEffect(() => {
    fetchPlayer({ id: 1 });
  }, [fetchPlayer]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{player?.name}</div>;
}
```

**FiveM Client (Lua):**

```lua
RegisterNUICallback("getPlayerData", function(data, cb)
  local playerId = data.id
  cb({ name = "John", level = 10 })
end)
```

---

### useSendNui

Hook for sending data to FiveM client without expecting a response.

```tsx
useSendNui<D>(
  eventName: string,
  options?: { mockDelay?: number }
): [(data?: D) => Promise<void>, { loading: boolean; error: Error | null }]
```

**Example:**

```tsx
import { useSendNui } from "fivem-nui-react";

function CloseButton() {
  const [closeUI, { loading }] = useSendNui<{ reason: string }>("closeUI");

  return (
    <button onClick={() => closeUI({ reason: "user_clicked" })} disabled={loading}>
      Close
    </button>
  );
}
```

**FiveM Client (Lua):**

```lua
RegisterNUICallback("closeUI", function(data, cb)
  SetNuiFocus(false, false)
  cb("ok")
end)
```

---

### isEnvBrowser

Check if running in browser (outside FiveM).

```tsx
import { isEnvBrowser } from "fivem-nui-react";

if (isEnvBrowser()) {
  console.log("Running in browser - debug mode");
}
```

---

## Browser Testing

All hooks support mock data for testing in browser without FiveM:

| Option | Description | Default |
|--------|-------------|---------|
| `mockData` | Data to return in browser mode | - |
| `mockDelay` | Delay in ms before returning | 500 |

When `isEnvBrowser()` is `true`:
- `useNuiEvent` triggers handler with `mockData` after delay
- `fetchNui` returns `mockData` after delay
- `useNuiCallback` calls callback with `mockData` after delay
- `useSendNui` simulates delay only

---

## TypeScript

All functions are fully typed:

```tsx
interface PlayerData {
  name: string;
  level: number;
}

interface PlayerRequest {
  id: number;
}

// Typed response
const player = await fetchNui<PlayerData, PlayerRequest>("getPlayer", { id: 1 });

// Typed callback
const [fetchPlayer, { loading }] = useNuiCallback<PlayerData, PlayerRequest>(
  "getPlayer",
  (data) => console.log(data.name)
);
```

## License

MIT
