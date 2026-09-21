import { useState, useEffect } from 'react';

export function useSystemMetrics(interval = 1000) {
  const [metrics, setMetrics] = useState({ uptime: '', load: '', timestamp: 0 });

  useEffect(() => {
    let active = true;
    let timerId: any = null;

    const fetchMetrics = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (active) {
          timerId = setTimeout(fetchMetrics, interval);
        }
        return;
      }
      try {
        const response = await fetch('/api/system-metrics', { signal: AbortSignal.timeout(2000) }).catch(() => null);
        if (active && response && response.ok) {
          const data = await response.json().catch(() => null);
          if (active && data) {
            setMetrics(data);
          }
        }
      } catch {}

      if (active) {
        timerId = setTimeout(fetchMetrics, interval);
      }
    };
    
    fetchMetrics();
    
    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [interval]);

  return metrics;
}

