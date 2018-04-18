# react-native-cache

LRU cache built on top of React Native's AsyncStorage (or included MemoryStore) and automatic pruning of least recently used items.

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
var cache = new Cache({
    namespace: "myapp",
    policy: {
        maxEntries: 50000
    },
    backend: AsyncStorage
});
```

Multiple caches can be mantained in an application by instantiating caches with different namespaces.

### Setting an item in the cache

```javascript
cache.setItem("hello", "world", function(err) {
    // key 'hello' is 'world' in cache
});
```

### Get an item in the cache

```javascript
cache.getItem("key1", function(err, value) {
    console.log(value);
    // 'hello'
});
```

Getting an item from the cache also moves it to the end of the LRU list: it will be evicted from the cache last.

### Delete an item from the cache

```javascript
cache.removeItem("key1", function(err) {
    // 'key1' is no more.
});
```

### Peeking at an item in the cache

You can also peek at an item in the cache without updating its position in the LRU list:

```javascript
cache.peekItem("key1", function(err, value) {
    // 'world'
});
```

### Getting all of the elements in the cache

You can look at all of the elements in the cache without updating its position in the LRU list:

```javascript
cache.getAll(function(err, entries) {
    // {
    //     "key1": { "value": 42 }
    //     "key2": { "value": 2 }
    //     ...
    // }
});
```

### Clearing all of the elements in the cache

You can also clear all of the items in the cache with:

```javascript
cache.clearAll(function(err) {
    // the whole cache is cleared now.
});
```

For more usage examples, see the tests.
