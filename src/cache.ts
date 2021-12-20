export interface ICacheOptions {
    // backend is expected to have the same static interface as AsyncStorage
    backend: any;
    namespace: string;
    policy: ICachePolicy;
}

export interface ICachePolicy {
    maxEntries: number;
    stdTTL: number; // second
}

export default class Cache {
    protected backend: any;
    protected namespace: string;
    protected policy: ICachePolicy;

    constructor(options: ICacheOptions) {
        this.namespace = options.namespace;
        this.backend = options.backend;
        this.policy = options.policy;
        let ttl = this.policy.stdTTL;
        if (!ttl || typeof ttl !== "number") {
            ttl = 0;
        }
        this.policy.stdTTL = ttl;
    }

    public async clearAll() {
        const keys = await this.backend.getAllKeys();
        const namespaceKeys = keys.filter((key: string) => {
            return key.substr(0, this.namespace.length) === this.namespace;
        });

        await this.backend.multiRemove(namespaceKeys);

        return this.setLRU([]);
    }

    public async enforceLimits(): Promise<void> {
        if (!this.policy.maxEntries) {
            return;
        }

        const lru = await this.getLRU();
        const victimCount = Math.max(0, lru.length - this.policy.maxEntries);
        const victimList = lru.slice(0, victimCount);

        const removePromises = [];
        for (const victimKey of victimList) {
            removePromises.push(this.remove(victimKey));
        }

        await Promise.all(removePromises);

        const survivorList = lru.slice(victimCount);
        return this.setLRU(survivorList);
    }

    public async getAll() {
        const keys = await this.backend.getAllKeys();
        const namespaceKeys = keys.filter((key: string) => {
            return key.substr(0, this.namespace.length) === this.namespace;
        });

        const results = await this.backend.multiGet(namespaceKeys);
        const allEntries: { [key: string]: any } = {};
        for (const [compositeKey, value] of results) {
            const key = this.fromCompositeKey(compositeKey);

            if (key === "_lru") {
                continue;
            }

            allEntries[key] = JSON.parse(value);
        }

        return allEntries;
    }

    public async get(key: string): Promise<string | undefined> {
        const value = await this.peek(key);

        if (!value) {
            return;
        }

        this.refreshLRU(key);

        return value;
    }

    public async peek(key: string): Promise<string | undefined> {
        const compositeKey = this.makeCompositeKey(key);
        const entryJsonString = await this.backend.getItem(compositeKey);

        let entry;
        if (entryJsonString) {
            entry = JSON.parse(entryJsonString);
        }

        let value;
        if (entry) {
            value = entry.value;
            if (this.policy.stdTTL > 0) {
                const created = entry.created ? Date.parse(entry.created) : 0;
                const deadline = created + this.policy.stdTTL * 1000;
                const now = Date.now();
                if (deadline < now) {
                    this.remove(key);
                    value = undefined;
                }
            }
        }

        return value;
    }

    public async remove(key: string): Promise<void> {
        const compositeKey = this.makeCompositeKey(key);
        await this.backend.removeItem(compositeKey);

        return this.removeFromLRU(key);
    }

    public async set(key: string, value: string): Promise<void> {
        const entry = {
            created: new Date(),
            value,
        };

        const compositeKey = this.makeCompositeKey(key);
        const entryString = JSON.stringify(entry);

        await this.backend.setItem(compositeKey, entryString);
        await this.refreshLRU(key);
        return this.enforceLimits();
    }

    protected async addToLRU(key: string) {
        const lru = await this.getLRU();

        lru.push(key);

        return this.setLRU(lru);
    }

    protected async getLRU() {
        const lruString = await this.backend.getItem(this.getLRUKey());
        let lru: string[];

        if (!lruString) {
            lru = [];
        } else {
            lru = JSON.parse(lruString);
        }

        return lru;
    }

    protected getLRUKey() {
        return this.makeCompositeKey("_lru");
    }

    protected makeCompositeKey(key: string) {
        return `${this.namespace}:${key}`;
    }

    protected fromCompositeKey(compositeKey: string) {
        return compositeKey.slice(this.namespace.length + 1);
    }

    protected async refreshLRU(key: string) {
        await this.removeFromLRU(key);
        return this.addToLRU(key);
    }

    protected async removeFromLRU(key: string) {
        const lru = await this.getLRU();

        const newLRU = lru.filter((item: string) => {
            return item !== key;
        });

        return this.setLRU(newLRU);
    }

    protected async setLRU(lru: string[]) {
        return this.backend.setItem(this.getLRUKey(), JSON.stringify(lru));
    }
}
