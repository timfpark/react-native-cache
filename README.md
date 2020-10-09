# react-native-cache

LRU cache built on top of the [React Native communities' AsyncStorage v2](https://github.com/react-native-community/async-storage/tree/master) (or included MemoryStore) and automatic pruning of least recently used items.

## Installation

*   Run the following command.

```shell
npm install --save react-native-cache
```

*   Import the library.

```javascript
import { Cache } from "react-native-cache";
```

## Usage

You initialize a cache using the following.

```javascript
const cache = new Cache({
    namespace: "myapp",
    policy: {
        maxEntries: 50000, // if unspecified, it can have unlimited entries
        stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
    },
    backend: AsyncStorage
});
```

Multiple caches can be mantained in an application by instantiating caches with different namespaces.

### Setting a key's value in the cache

```javascript
await cache.set("hello", "world");
// key 'hello' is now set to 'world' in namespace 'myapp'
```

### Get an item in the cache

```javascript
const value = await cache.get("key1");
console.log(value);
// 'hello'
});
```

Getting an item from the cache also moves it to the end of the LRU list: it will be evicted from the cache last.

### Delete an item from the cache

```javascript
await cache.remove("key1");
// 'key1' is no more.
```

### Peeking at an item in the cache

You can also peek at an item in the cache without updating its position in the LRU list:

```javascript
const value = await cache.peek("key1");
// value is retrieved but LRU value is unchanged.
```

### Getting all of the elements in the cache

You can look at all of the elements in the cache without updating its position in the LRU list:

```javascript
const entries = await cache.getAll();
console.dir(entries);
// {
//     "key1": { "value": 42 }
//     "key2": { "value": 2 }
//     ...
// }
```

### Clearing all of the elements in the cache

You can also clear all of the items in the cache with:

```javascript
await cache.clearAll();
```

For more usage examples, see the tests.
