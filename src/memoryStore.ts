import { ICacheBackend } from "./cache";

export default class MemoryStore implements ICacheBackend {
    private store: any;

    constructor() {
        this.store = {};
    }

    public async set(key: string, value: string): Promise<void> {
        this.store[key] = value;
    }

    public async getKeys(): Promise<string[]> {
        return Object.keys(this.store);
    }

    public async get(key: string): Promise<string> {
        return this.store[key];
    }

    public async getMultiple(keys: string[]): Promise<any[][]> {
        const results: any[][] = [];
        for (const key of keys) {
            results.push([key, this.store[key]]);
        }

        return results;
    }

    public async removeMultiple(keys: string[]): Promise<void> {
        for (const key of keys) {
            delete this.store[key];
        }
    }

    public async remove(key: string): Promise<void> {
        delete this.store[key];
    }
}
