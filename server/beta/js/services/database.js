/**
 * Service for making queries to the database.  Right now the 'database' is local storage.
*/
beta.factory('database', function ($http, storage) {

    'use strict';

    var checksums = {'index':'ff9048db82bc21bc6993b5ece1330fe1','crag/buttermilks':'6fb24014363d2ba08b2e54ebdf843b7c','crag/happyboulders':'6d7844b2ac284343868dc911b7444a73','crag/joshuatree':'0800ef3bd41d083b0ce304bccbdd3100','crag/klingerspring':'58c53a6eef24ddb0b2fab36493ce174b','crag/mtcharleston':'159e7e8bd29d1a22b905a394988fb4f0','crag/owensrivergorge':'bc9f79e7e764609895884a4974ae141d','crag/redrivergorge':'d4626f643e82502b0d971f03eee1d742','crag/redrock':'186d0c98a8fbf300255f9afea088eba2','crag/sadboulders':'b6e5d9138ad83f8188c9f45cb752c711','crag/smithrock':'f71f9c9520a82525bf5c6bd092934295','crag/yosemitevalley':'653e482bd250d3fcf2931f6ea895de4b'};

    var data = {};
    var cached = JSON.parse(localStorage.getItem('cached')) || { };

    // Clear the database if the client has the old database version.
    if (localStorage.getItem('version')) {
        localStorage.clear();
    }

    function cache(name, value) {
        // Do not overwrite existing data.  During an update we'll explicitly delete the entry immediately
        // prior to calling cache.  This prevents overwriting an update with stale data from local storage.
        if (!data.hasOwnProperty(name)) {
            data[name] = value;
        }

        if (!cached.hasOwnProperty(name)) {
            cached[name] = checksums[name];
            localStorage.setItem('cached', JSON.stringify(cached));
        }
    }

    function httpGet(name, callback) {
        // Append the hash as a query string to create a unique URI.  This allows CDNs to cache the data
        // but guarantees we'll get the latest version, all without having to store multiple versions on
        // the server.
        $http.get('data/' + name + '?version=' + checksums[name]).then(
            function(response) {
                cache(name, response.data);
                storage.set(name, JSON.stringify(response.data));
                callback(data[name]);
            },
            function(response) {
                callback(null, response);
            }
        );
    }

    function get(name, callback) {
        if (data.hasOwnProperty(name)) {
            callback(data[name]);
        }
        else {
            storage.get(name).then(
                function(value) {
                    cache(name, JSON.parse(value));
                    callback(data[name]);
                },
                function(error) {
                    if (error) {
                        callback(null);
                    }
                    else{
                        httpGet(name, callback);
                    }
                }
            );
        }
    }

    function update(name) {
        httpGet(name, function(value) {
            if (value) {
                delete data[name];
                delete cached[name];
                cache(name, value);
            }
        }, true);
    }

    function unpackArea(crag, area) {
        var ret = _.omit(area, ['areas', 'boulders', 'routes', 'problems']);

        if (area.areas) {
            ret.climbingAreas = _.map(area.areas, function(subarea) {
                return crag.subareas[subarea];
            });
        }
        if (area.boulders) {
            ret.boulderingAreas = _.map(area.boulders, function(subarea) {
                return crag.subareas[subarea];
            });
        }
        if (area.routes) {
            ret.routes = _.map(area.routes, function(route) {
                return crag.routes[route];
            });
        }
        if (area.problems) {
            ret.problems = _.map(area.problems, function(problem) {
                return crag.routes[problem];
            });
        }
        return ret;
    }

    function unpackCrag(crag) {
         if (!crag.climbingAreas && !crag.boulderingAreas) {
            if (crag.areas.climbing) {
                crag.climbingAreas = _.sortBy(_.values(crag.areas.climbing), 'name');
            }
            if (crag.areas.bouldering) {
                crag.boulderingAreas = _.sortBy(_.values(crag.areas.bouldering), 'name');
            }
        }
        return crag;
    }

    var db = {
        index: function(callback) {
            get('index', callback);
        },
        crag: function(cragName, callback) {
            get('crag/' + cragName, function(crag) {
                if (!crag) {
                    callback(null, { status: 404, data: 'The crag "' + cragName + '" does not exist.' });
                }
                else {
                    callback(unpackCrag(crag));
                }
            });
        },
        area: function(cragName, area, callback) {
            get('crag/' + cragName, function(crag) {
                if (!crag) {
                    callback(null, { status: 404, data: 'The crag "' + cragName + '" does not exist.' });
                }
                else if (crag.areas.bouldering && crag.areas.bouldering.hasOwnProperty(area)) {
                    callback(unpackArea(crag, crag.areas.bouldering[area]));
                }
                else if (crag.areas.climbing && crag.areas.climbing.hasOwnProperty(area)) {
                    callback(unpackArea(crag, crag.areas.climbing[area]));
                }
                else if (crag.subareas && crag.subareas.hasOwnProperty(area)) {
                    callback(unpackArea(crag, crag.subareas[area]));
                }
                else {
                    callback(null, { status: 404, data: 'The area "' + area + '" does not exist in ' + crag.name } );
                }
            });
        },
        route: function(cragName, route, callback) {
            get('crag/' + cragName, function(crag) {
                if (!crag) {
                    callback(null, { status: 404, data: 'The crag "' + cragName + '" does not exist.' });
                }
                else if (crag.routes.hasOwnProperty(route)) {
                    callback(crag.routes[route]);
                }
                else {
                    callback(null, { status: 404, data: 'The route "' + route + '" does not exist in ' + crag.name } );
                }
            });
        }
    };

    _.each(_.keys(cached), function(entry) {
        if (entry === 'index') {
            db.index(function() {});
        }
        else {
            db.crag(entry.replace('crag/', ''), function() {});
        }
        if (cached[entry] !== checksums[entry]) {
            update(entry);
        }
    });


    return db;
});