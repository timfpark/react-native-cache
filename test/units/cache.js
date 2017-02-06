var assert = require('assert')
  , Cache = require('../../lib').Cache
  , MemoryStore = require('../../lib').MemoryStore;

var cache = new Cache({
    namespace: 'test',
    policy: {
        maxEntries: 1
    },
    backend: MemoryStore
});

describe('cache', function() {
    it('can set and get entry', function(done) {
        cache.setItem('key1', 'value1', function(err) {
            assert(!err);
            cache.getItem('key1', function(err, value) {
                assert(!err);
                assert.equal(value, 'value1');

                done();
            });
        })
    });

    it('can delete entry', function(done) {
        cache.setItem('key1', 'value1', function(err) {
            assert(!err);
            cache.removeItem('key1', function(err) {
                assert(!err);
                cache.getItem('key1', function(err, value) {
                    assert(!err);
                    assert(!value);

                    done();
                });
            });
        });
    });

    it('evicts entries in lastAccessed order', function(done) {
        cache.setItem('key1', 'value1', function(err) {
            assert(!err);
            cache.setItem('key2', 'value2', function(err) {
                assert(!err);
                cache.getItem('key1', function(err, value) {
                    assert(!err);
                    assert(!value);
                    cache.getItem('key2', function(err, value) {
                        assert(!err);
                        assert.equal(value, 'value2');

                        done();
                    });
                });
            });
        });
    });

    it('can peek at a message', function(done) {
        cache.setItem('key1', 'value1', function(err) {
            assert(!err);
            cache.peekItem('key1', function(err, value) {
                assert(!err);
                assert.equal(value, 'value1');
                done();
            });
        })
    })
});