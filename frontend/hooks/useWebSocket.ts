"use client";
import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useUIStore } from "@/stores/uiStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000";

export interface UseWebSocketOptions {
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True once the effect cleanup has intentionally closed the socket; prevents
  // the async onclose handler from scheduling a zombie reconnect after unmount.
  const disposedRef = useRef(false);
  // Ensures the "connection lost" toast fires only once per disconnect burst.
  const reconnectNotifiedRef = useRef(false);

  // Keep latest callback without re-running effect
  const onMessageRef = useRef(onMessage);
  
  const setStatus = useUIStore((s) => s.setConnectionStatus);
  const setStatusRef = useRef(setStatus);

  // connectRef allows the closure inside ws.onclose to call connect without stale ref
  const connectRef = useRef<() => void>(null!);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    setStatusRef.current = setStatus;
  }, [setStatus]);

  useEffect(() => {
    connectRef.current = () => {
      if (!enabled) return;
      setStatusRef.current("connecting");

      const ws = new WebSocket(`${WS_BASE}/ws/events`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectCountRef.current = 0;
        reconnectNotifiedRef.current = false;
        setStatusRef.current("connected");
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data as string);
          if ((data as { type?: string }).type === "pong") return;
          onMessageRef.current(data);
        } catch {
          // ignore malformed JSON
        }
      };

      ws.onclose = () => {
        // Unmount cleanup already ran, or a newer socket has superseded this one
        // (e.g. React StrictMode dev remount): do not touch global status or
        // schedule a reconnect from this stale socket.
        if (disposedRef.current || wsRef.current !== ws) return;
        setStatusRef.current("disconnected");
        if (!enabled) return;
        if (reconnectCountRef.current >= 5) {
          setStatusRef.current("error");
          toast.error("WebSocket connection failed after 5 retries. Check backend URL.");
          return;
        }
        if (!reconnectNotifiedRef.current) {
          reconnectNotifiedRef.current = true;
          toast.error("Connection lost, reconnecting…", { id: "ws-reconnect" });
        }
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30_000);
        reconnectCountRef.current += 1;
        setStatusRef.current("reconnecting");
        reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
      };

      // onclose always follows onerror and handles status/retry; keep onerror
      // silent to avoid toast spam and status churn on every failed attempt.
      ws.onerror = () => {};
    };
  }, [enabled]);

  const send = useCallback((command: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Fresh (re)mount — allow onclose to manage status/reconnect again.
    disposedRef.current = false;
    connectRef.current();

    const pingId = setInterval(() => send({ command: "ping" }), 30_000);

    return () => {
      // Mark disposed before closing so the async onclose bails out instead of
      // scheduling a zombie reconnect after unmount.
      disposedRef.current = true;
      clearInterval(pingId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, send]);

  return { send };
}
