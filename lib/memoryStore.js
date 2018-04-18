var store = {};

function MemoryStore() {}

MemoryStore.getItem = function(key, callback) {
    return callback(null, store[key]);
};

MemoryStore.setItem = function(key, value, callback) {
    store[key] = value;
    return callback();
};

MemoryStore.removeItem = function(key, callback) {
    delete store[key];
    return callback();
};

MemoryStore.getAllKeys = function(callback) {
    return callback(null, Object.keys(store));
};

MemoryStore.multiRemove = function(keys, callback) {
    keys.forEach(function(key) {
        delete store[key];
    });

    return callback();
};

MemoryStore.multiGet = function(keys, callback) {
    var results = [];
    keys.forEach(function(key) {
        results.push([key, store[key]]);
    });

    return callback(null, results);
};

module.exports = MemoryStore;
