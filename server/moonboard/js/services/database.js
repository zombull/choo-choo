/**
 * Service for making queries to the database.
*/
moon.factory('database', function (storage, schema) {
    'use strict';

    _.each(storage.checksums(), function(sum, key) {
        if (sum !== schema.checksums[key]) {
            storage.update(key);
        } else {
            storage.get(key, function() { });
        }
    });

    function doCallback(scope, callback, data, error) {
        if (error) {
            if (scope) {
                scope.error = scope.error || error;
            } else {
                console.log(error);
            }
        } else {
            callback(data);
        }
    }

    return {
        all: function(callback, scope) {
            storage.get('master', doCallback.bind(this, scope, function(data) {
                storage.get('ticks', doCallback.bind(this, scope, function(ticks, error) {
                    callback(data, ticks);
                }));
            }));
        },
        master: function(callback, scope) {
            storage.get('master', doCallback.bind(this, scope, callback));
        },
        images: function(callback, scope) {
            storage.get('master', doCallback.bind(this, scope, function(data) {
                callback(data.img);
            }));
        },
        ticks: function(callback, scope) {
            storage.get('ticks', doCallback.bind(this, scope, callback));
        },
    };
});