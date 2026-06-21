import { useEffect, useRef, useState } from 'react';

export function useSocket(onMsg: (m: any) => void) {
  const cb = useRef(onMsg);
  cb.current = onMsg;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try { cb.current(JSON.parse(e.data)); } catch { /* */ }
    };
    return () => ws.close();
  }, []);

  return { connected };
}
