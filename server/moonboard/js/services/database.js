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

    return {
        raw: function(callback) {
            storage.get('master', callback);
        },
        problem: function(name, callback) {
            storage.get('master', function(data) {
                if (!data.p.hasOwnProperty(name)) {
                    callback(null, null, null, { status: 404, data: 'The problem "' + name + '" does not exist.' });
                }
                else {
                    storage.get('ticks', function(ticks) {
                            var me = data.p[name];
                            var problem = data.i[me];
                            var setter = data.i[problem.e];
                            var grades = data.g[problem.v / 10];
                            var suggested = { setter: [], grade: [] }
                            _.each(setter.p, function(p) {
                                if (p != me && suggested.setter.length < 10 && !ticks.hasOwnProperty(p)) {
                                    suggested.setter.push(data.i[p])
                                }
                            });
                            _.each(grades, function(p) {
                                if (p != me && (suggested.grade.length + suggested.setter.length) < 20 &&  !ticks.hasOwnProperty(p)) {
                                    suggested.grade.push(data.i[p])
                                }
                            });
                            var tick = ticks.hasOwnProperty(problem.i) ? ticks[problem.i] : null;
                            callback(problem, setter, tick, suggested)
                    });
                }
            });
        },
        images: function(callback) {
            storage.get('master', function(data) {
                callback(data.img);
            });
        },
        ticks: function(callback) {
            storage.get('ticks', callback);
        },
    };
});