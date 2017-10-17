/**
 * Service for making queries to the database.
*/
moon.factory('database', function (storage, schema) {
    'use strict';

    _.each(storage.checksums(), function(sum, key) {
        console.log('key'+key)
        console.log('sum'+sum)
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
                    var me = data.p[name];
                    var problem = data.i[me];
                    var setter = data.i[problem.e];
                    var grades = data.g[problem.d / 10];
                    var suggested = { setter: [], grade: [] }
                    _.each(setter.p, function(p) {
                        if (p != me && suggested.setter.length < 10) {
                            suggested.setter.push(data.i[p])
                        }
                    });
                    _.each(grades, function(p) {
                        if (p != me && (suggested.grade.length + suggested.setter.length) < 20) {
                            suggested.grade.push(data.i[p])
                        }
                    });
                    callback(problem, setter, suggested)
                }
            });
        },
        images: function(callback) {
            storage.get('master', function(data) {
                callback(data.img);
            });
        },
    };
});