import Cache from "../src/cache";
import MemoryStore from "../src/memoryStore";

const cache = new Cache({
    namespace: "test",
    policy: {
        maxEntries: 1,
        stdTTL: 3600,
    },
    backend: MemoryStore
});

describe("cache", () => {
    it("can set and get entry", async () => {
        await cache.set("key1", "value1");
        const value = await cache.get("key1");

        expect(value).toBe("value1");
    });

    it("can get a nonexistant item", async () => {
        const value = await cache.get("doesnotexist");

        expect(value).toBeUndefined();
    });

    it("can delete entry", async () => {
        await cache.set("key2", "value2");
        await cache.remove("key2");

        const value = await cache.get("key2");

        expect(value).toBeUndefined();
    });

    it("evicts entries in lastAccessed order", async () => {
        await cache.set("key1", "value1");
        await cache.set("key2", "value2");

        const value1 = await cache.get("key1");
        expect(value1).toBeUndefined();

        const value2 = await cache.get("key2");
        expect(value2).toBe("value2");
    });

    it("can peek at a item", async () => {
        await cache.set("key1", "value1");
        const value = await cache.peek("key1");

        expect(value).toBe("value1");
    });

    it("can set and get entry with colon in key", async () => {
        await cache.set("key2:key2", "value2");
        const value = await cache.get("key2:key2");

        expect(value).toBe("value2");
    });

    it("can get all elements", async () => {
        const entries = await cache.getAll();

        expect(entries).not.toBeUndefined();
        expect(Object.keys(entries).length).toBe(1);

        const key2Entry = entries["key2:key2"];
        expect(key2Entry["value"]).toBe("value2");
    });

    it("can clear all elements", async () => {
        await cache.clearAll();

        const entries = await cache.getAll();

        expect(Object.keys(entries).length).toBe(0);
    });
});
