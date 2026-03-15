import { EventEmitter } from 'events';

const WINNER_EVENT = 'winner-announced';

const globalForEvents = globalThis as unknown as {
  oscarEventBus: EventEmitter;
};

const eventBus = globalForEvents.oscarEventBus ?? new EventEmitter();
eventBus.setMaxListeners(50);

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.oscarEventBus = eventBus;
}

export function emitWinnerAnnounced(categorySlug: string) {
  eventBus.emit(WINNER_EVENT, categorySlug);
}

export function onWinnerAnnounced(callback: (categorySlug: string) => void) {
  eventBus.on(WINNER_EVENT, callback);
}

export function offWinnerAnnounced(callback: (categorySlug: string) => void) {
  eventBus.off(WINNER_EVENT, callback);
}
