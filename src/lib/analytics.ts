// Preparation only: no counter is loaded, no sink is wired, and the site does not import this module.
const events = new Set(['page_view', 'service_click', 'cta_click', 'form_open', 'form_start', 'messenger_click']);

export function createPreparedAnalytics(options: { enabled?: boolean; sink?: (event: string) => void } = {}) {
  return {
    record(event: unknown): boolean {
      if (options.enabled !== true || !options.sink || typeof event !== 'string' || !events.has(event)) return false;
      options.sink(event);
      return true;
    },
  };
}
