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

    var __data = null;

    return {
        all: function(callback, scope) {
            if (__data) {
                callback(__data);
            } else {
                storage.get('master', doCallback.bind(this, scope, function(data) {
                    storage.get('ticks', doCallback.bind(this, scope, function(ticks, error) {
                        __data = data;

                         // Unpack tick info into problems.
                        var end = _.size(__data.p);
                        _.each(__data.i, function(problem, i) {
                            __data.i[i].t = ticks.hasOwnProperty(i) ? ticks[i] : null;
                        });
                        callback(__data);
                    }));
                }));
            }
        },
        images: function(callback, scope) {
            storage.get('master', doCallback.bind(this, scope, function(data) {
                callback(data.img);
            }));
        },
        setters: function(callback, scope) {
            if (__data) {
                callback(_.slice(__data.i, _.size(__data.p)));
            } else {
                storage.get('master', doCallback.bind(this, scope, function(data) {
                    callback(_.slice(data.i, _.size(data.p)));
                }));
            }
        },
        setterIds: function(callback, scope) {
            if (__data) {
                callback(__data.s);
            } else {
                storage.get('master', doCallback.bind(this, scope, function(data) {
                    callback(data.s);
                }));
            }
        }
    };
});