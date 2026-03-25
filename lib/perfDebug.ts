import { useEffect, useRef } from 'react';

const PERF_FLAG = import.meta.env.VITE_PERF_DEBUG === 'true' || import.meta.env.VITE_PERF_DEBUG === true;

let longTaskObserverStarted = false;

export function initPerfDebug(label = 'app') {
    if (!PERF_FLAG || typeof window === 'undefined' || longTaskObserverStarted) return;

    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.info('[perf] long task', {
                        label,
                        name: entry.name,
                        duration: Math.round(entry.duration)
                    });
                });
            });
            observer.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
            longTaskObserverStarted = true;
        } catch (err) {
            console.info('[perf] PerformanceObserver unavailable for long tasks', err);
        }
    }
}

export function useRenderCounter(label: string) {
    const renderCount = useRef(0);

    useEffect(() => {
        if (!PERF_FLAG) return;
        renderCount.current += 1;
        console.info('[perf] render', { label, count: renderCount.current, ts: performance.now().toFixed(1) });
    });
}
