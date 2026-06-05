declare module "event-source-polyfill" {
  export class EventSourcePolyfill {
    constructor(url: string, options?: { headers?: Record<string, string> });
    close(): void;
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
  }
}
