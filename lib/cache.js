var async = require('async'),
    MemoryStore = require('./memoryStore');

function Cache(options) {
    this.namespace = options.namespace || 'cache';
    this.backend = options.backend || MemoryStore;
    this.policy = options.policy || { maxEntries: 50000 };
}

Cache.prototype.addToLRU = function(key, callback) {
    var self = this;
    this.getLRU(function(err, lru) {
        if (err) return callback(err);

        lru.push(key);

        self.setLRU(lru, callback);
    });
};

Cache.prototype.removeFromLRU = function(key, callback) {
    var self = this;
    this.getLRU(function(err, lru) {
        if (err) return callback(err);

        var newLRU = lru.filter(function(item) {
            return item !== key;
        });

        self.setLRU(newLRU, callback);
    });
};

Cache.prototype.refreshLRU = function(key, callback) {
    var self = this;
    this.removeFromLRU(key, function(err) {
        if (err) return callback(err);
        self.addToLRU(key, callback);
    });
};

Cache.prototype.getLRUKey = function() {
    return this.makeCompositeKey('_lru');
};

Cache.prototype.getLRU = function(callback) {
    this.backend.getItem(this.getLRUKey(), function(err, dirString) {
        if (err) return callback(err);

        var dir;
        if (!dirString) dir = [];
        else dir = JSON.parse(dirString);

        return callback(null, dir);
    });
};

Cache.prototype.setLRU = function(lru, callback) {
    this.backend.setItem(this.getLRUKey(), JSON.stringify(lru), function(err) {
        return callback(err, lru);
    });
};

Cache.prototype.enforceLimits = function(callback) {
    var self = this;
    if (!this.policy.maxEntries) return callback();

    this.getLRU(function(err, lru) {
        var victimCount = Math.max(0, lru.length - self.policy.maxEntries);
        var victimList = lru.slice(0, victimCount);
        async.eachSeries(
            victimList,
            function(key, callback) {
                self.removeItem(key, callback);
            },
            function(err) {
                var survivorList = lru.slice(victimCount);
                self.setLRU(survivorList, callback);
            }
        );
    });
};

Cache.prototype.removeItem = function(key, callback) {
    var self = this;
    var compositeKey = this.makeCompositeKey(key);
    this.backend.removeItem(compositeKey, function(err) {
        if (err) return callback(err);

        self.removeFromLRU(key, callback);
    });
};

Cache.prototype.getItem = function(key, callback) {
    var self = this;

    this.peekItem(key, function(err, value) {
        if (err) return callback(err);
        if (!value) return callback();

        self.refreshLRU(key, function(err) {
            if (err) return callback(err);

            return callback(null, value);
        });
    });
};

Cache.prototype.makeCompositeKey = function(key) {
    return this.namespace + ':' + key;
};

Cache.prototype.peekItem = function(key, callback) {
    var compositeKey = this.makeCompositeKey(key);
    this.backend.getItem(compositeKey, function(err, entryJsonString) {
        if (err) return callback(err);

        var entry;
        if (entryJsonString) {
            entry = JSON.parse(entryJsonString);
        }

        var value;
        if (entry) value = entry.value;

        return callback(null, value);
    });
};

Cache.prototype.setItem = function(key, value, callback) {
    var self = this;
    var entry = {
        created: new Date(),
        value: value
    };

    var compositeKey = this.makeCompositeKey(key);
    var entryString = JSON.stringify(entry);

    self.backend.setItem(compositeKey, entryString, function(err) {
        if (err) return callback(err);

        self.refreshLRU(key, function(err) {
            if (err) return callback(err);

            self.enforceLimits(callback);
        });
    });
};

Cache.prototype.clearAll = function(callback) {
    var self = this;
    self.backend.getAllKeys(function(err, keys) {
        if (err) return callback(err);

        var namespaceKeys = keys.filter(key => {
            return key.substr(0, self.namespace.length) == self.namespace;
        });

        self.backend.multiRemove(namespaceKeys, function(err) {
            if (err) return callback(err);

            self.setLRU([], callback);
        });
    });
};

Cache.prototype.getAll = function(callback) {
    var self = this;
    self.backend.getAllKeys(function(err, keys) {
        if (err) return callback(err);

        var namespaceKeys = keys.filter(key => {
            return key.substr(0, self.namespace.length) == self.namespace;
        });

        self.backend.multiGet(namespaceKeys, function(err, results) {
            if (err) return callback(err);

            var allEntries = {};
            results.forEach(result => {
                var keyComponents = result[0].split(':');

                if (keyComponents.length !== 2) return;

                var key = keyComponents[1];

                if (key === '_lru') return;

                allEntries[key] = JSON.parse(result[1]);
            });

            return callback(null, allEntries);
        });
    });
};

module.exports = Cache;
