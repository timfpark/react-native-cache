type Callback<T = string> = (error: Error | undefined, value: T) => void;
type Key = string;
type Value = string | undefined;

interface CachePolicy {
  maxEntries: number;
}

interface CacheConfig  {
  namespace?: string;
  policy?: CachePolicy;
  backend: unknown;
}

class Cache {
  constructor(config: CacheConfig);
  setItem(key: Key, value: Value, callback: ErrorCallback): void;
  getItem(key: Key, callback: Callback): void;
  removeItem(key: Key, callback: ErrorCallback): void;
  peekItem(key: Key, callback: Callback): void;
  getAll(callback: Callback<Record<Key, { value: Value }>>): void;
  clearAll(callback: ErrorCallback): void;
}

export { Cache };
