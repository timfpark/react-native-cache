var store = [];

function MemoryStore() {}

MemoryStore.getItem = function(key, callback) {
    return callback(null, store[key]);
};

MemoryStore.setItem = function(key, value, callback) {
    store[key] = value;
    return callback();
};

MemoryStore.delItem = function(key, callback) {
    delete store[key];
    return callback();
};

module.exports = MemoryStore;
