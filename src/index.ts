import { useCallback, useEffect, useRef, useState } from "react";

const resourceName = (window as any).GetParentResourceName
  ? (window as any).GetParentResourceName()
  : "nui-frame-app";

// Types
export interface NuiMessageEvent<T = unknown> {
  action: string;
  data: T;
}

export type NuiEventHandler<T = unknown> = (data: T) => void;

export interface UseNuiEventOptions<T = unknown> {
  mockData?: T;
  mockDelay?: number;
}

export interface FetchNuiOptions<T = unknown> {
  mockData?: T;
  mockDelay?: number;
}

/**
 * Checks if running in browser debug mode
 */
export function isEnvBrowser(): boolean {
  return !(window as any).invokeNative;
}

/**
 * React hook for listening to NUI messages from Lua
 * @param action - The action name to listen for
 * @param handler - Callback function to execute when message is received
 * @param options - Options for mock data in browser mode
 * @example
 * useNuiEvent("showUI", (data) => {
 *   setVisible(data.visible);
 * }, { mockData: { visible: true }, mockDelay: 1000 });
 */
export function useNuiEvent<T = unknown>(
  action: string,
  handler: NuiEventHandler<T>,
  options?: UseNuiEventOptions<T>,
): void {
  const savedHandler = useRef<NuiEventHandler<T>>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (isEnvBrowser()) {
      if (options?.mockData === undefined) return;

      const delay = options.mockDelay ?? 500;
      const timeout = setTimeout(
        () => savedHandler.current(options.mockData as T),
        delay,
      );

      return () => clearTimeout(timeout);
    }

    const eventListener = (event: MessageEvent<NuiMessageEvent<T>>) => {
      const { action: eventAction, data } = event.data;

      if (eventAction === action) savedHandler.current(data);
    };

    window.addEventListener("message", eventListener);

    return () => window.removeEventListener("message", eventListener);
  }, [action, options?.mockData, options?.mockDelay]);
}

/**
 * Sends a request to NUI callback (fivem client)
 * @param eventName - The callback event name
 * @param data - Data to send
 * @param options - Options for mock data in browser mode
 * @returns Promise<T> - Response from fivem client
 * @example
 * const result = await fetchNui("getPlayerData", { id: 1 }, {
 *   mockData: { name: "John", level: 10 },
 *   mockDelay: 500
 * });
 */
export async function fetchNui<T = unknown, D = unknown>(
  eventName: string,
  data?: D,
  options?: FetchNuiOptions<T>,
): Promise<T> {
  if (isEnvBrowser()) {
    if (options?.mockData === undefined) return Promise.resolve(null as T);

    const delay = options.mockDelay ?? 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return options.mockData as T;
  }

  const response = await fetch(`https://${resourceName}/${eventName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data ?? {}),
  });

  return response.json() as Promise<T>;
}

export interface UseNuiCallbackOptions<T = unknown> {
  mockData?: T;
  mockDelay?: number;
}

export interface UseNuiCallbackState {
  loading: boolean;
  error: Error | null;
}

export type UseNuiCallbackReturn<T, D> = [
  (data?: D) => Promise<T>,
  UseNuiCallbackState,
];

/**
 * React hook for making NUI callback requests with loading and error states
 * @param eventName - The callback event name
 * @param callback - Callback function to execute when response is received
 * @param options - Options for mock data in browser mode
 * @returns [fetchFunction, { loading, error }]
 * @example
 * const [fetchPlayer, { loading, error }] = useNuiCallback<PlayerData>("getPlayer", (data) => {
 *   setPlayer(data);
 * }, {
 *   mockData: { name: "John", level: 10 },
 *   mockDelay: 500
 * });
 *
 * useEffect(() => {
 *   fetchPlayer({ id: 1 });
 * }, [fetchPlayer]);
 */
export function useNuiCallback<T = unknown, D = unknown>(
  eventName: string,
  callback: (data: T) => void,
  options?: UseNuiCallbackOptions<T>,
): UseNuiCallbackReturn<T, D> {
  const [state, setState] = useState<UseNuiCallbackState>({
    loading: false,
    error: null,
  });

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const fetch = useCallback(
    async (data?: D): Promise<T> => {
      setState({ loading: true, error: null });

      try {
        const result = await fetchNui<T, D>(eventName, data, options);
        callbackRef.current(result);
        setState({ loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ loading: false, error });
        throw error;
      }
    },
    [eventName, options],
  );

  return [fetch, state];
}

export interface UseSendNuiOptions {
  mockDelay?: number;
}

export interface UseSendNuiState {
  loading: boolean;
  error: Error | null;
}

export type UseSendNuiReturn<D> = [(data?: D) => Promise<void>, UseSendNuiState];

/**
 * React hook for sending data to NUI callback without expecting a response
 * @param eventName - The callback event name
 * @param options - Options for mock delay in browser mode
 * @returns [sendFunction, { loading, error }]
 * @example
 * const [closeUI, { loading }] = useSendNui("closeUI");
 *
 * const handleClose = () => {
 *   closeUI({ reason: "user_clicked" });
 * };
 */
export function useSendNui<D = unknown>(
  eventName: string,
  options?: UseSendNuiOptions,
): UseSendNuiReturn<D> {
  const [state, setState] = useState<UseSendNuiState>({
    loading: false,
    error: null,
  });

  const send = useCallback(
    async (data?: D): Promise<void> => {
      setState({ loading: true, error: null });

      try {
        if (isEnvBrowser()) {
          const delay = options?.mockDelay ?? 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          await fetch(`https://${resourceName}/${eventName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify(data ?? {}),
          });
        }
        setState({ loading: false, error: null });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ loading: false, error });
        throw error;
      }
    },
    [eventName, options],
  );

  return [send, state];
}
