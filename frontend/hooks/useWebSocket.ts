"use client";
import { useEffect, useRef, useCallback } from "react";
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

  // Keep latest callback without re-running effect
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const setStatus = useUIStore((s) => s.setConnectionStatus);
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;

  // connectRef allows the closure inside ws.onclose to call connect without stale ref
  const connectRef = useRef<() => void>(null!);

  connectRef.current = () => {
    if (!enabled) return;
    setStatusRef.current("connecting");

    const ws = new WebSocket(`${WS_BASE}/ws/events`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;
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
      setStatusRef.current("disconnected");
      if (!enabled) return;
      if (reconnectCountRef.current >= 5) {
        setStatusRef.current("error");
        return;
      }
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30_000);
      reconnectCountRef.current += 1;
      setStatusRef.current("reconnecting");
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };

    ws.onerror = () => setStatusRef.current("error");
  };

  const send = useCallback((command: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connectRef.current();

    const pingId = setInterval(() => send({ command: "ping" }), 30_000);

    return () => {
      clearInterval(pingId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, send]);

  return { send };
}
