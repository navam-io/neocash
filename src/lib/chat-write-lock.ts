/**
 * Per-key write serializer for IndexedDB chat records.
 *
 * Multiple concurrent read-modify-write operations on the same chat record
 * (e.g. messages persistence + tool executor updating dashboard values) can
 * clobber each other. This lock ensures writes for the same chatId execute
 * sequentially — each operation reads the latest state inside the lock.
 */
const locks = new Map<string, Promise<void>>();

export function withChatLock<T>(chatId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(chatId) ?? Promise.resolve();
  const next = prev.then(fn, fn); // run fn after prev settles (success or error)
  locks.set(chatId, next.then(() => {}, () => {})); // keep chain alive, swallow errors
  return next;
}
