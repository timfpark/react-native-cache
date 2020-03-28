export interface ICacheOptions {
    // backend is expected to have the same static interface as AsyncStorage
    backend: any;
    namespace: string;
    policy: ICachePolicy;
}

export interface ICachePolicy {
    maxEntries: number;
}

export default class Cache {
    protected backend: any;
    protected namespace: string;
    protected policy: ICachePolicy;

    constructor(options: ICacheOptions) {
        this.namespace = options.namespace;
        this.backend = options.backend;
        this.policy = options.policy;
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
        const allEntries: { [key: string]: string } = {};
        for (const result of results) {
            const keyComponents = result[0].split(":");

            if (keyComponents.length !== 2) {
                continue;
            }

            const key: string = keyComponents[1];

            if (key === "_lru") {
                continue;
            }

            allEntries[key] = JSON.parse(result[1]);
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
            value
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
