export const getStatus = () => fetch('/api/status').then((r) => r.json());
export const getSnapshot = () => fetch('/api/snapshot').then((r) => r.json());
export const runScenario = (scenario: string, mode: string, params: any = {}) =>
  fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, mode, params }),
  }).then((r) => r.json());
