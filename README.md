# react-native-cache

LRU cache built on top of React Native's AsyncStorage (or included MemoryStore) and automatic pruning of least recently used items.

## Usage

You initialize a cache using the following.

```javascript
var cache = new Cache({
    namespace: 'myapp',
    policy: {
        maxEntries: 50000
    },
    backend: AsyncStorage
});
```

Multiple caches can be mantained in an application by instantiating caches with different namespaces.

### Setting an item in the cache

```javascript
cache.setItem('hello', 'world', function(err) {
    // key 'hello' is 'world' in cache
});
```

### Get an item in the cache

```javascript
cache.getItem('key1', function(err, value) {
   console.log(value);
   // 'hello'
});
```

Getting an item from the cache also moves it to the end of the LRU list: it will be evicted from the cache last.

### Delete an item from the cache

```javascript
cache.removeItem('key1', function(err) {
    // 'key1' is no more.
});
```

### Peeking at an item in the cache

You can also peek at an item in the cache without updating its position in the LRU list:

```javascript
cache.peekItem('key1', function(err, value) {
    // 'world'
});
```

For more usage examples, see the tests.
