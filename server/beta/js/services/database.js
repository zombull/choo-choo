/**
 * Service for making queries to the database.
*/
beta.factory('database', function (storage, schema) {
    'use strict';

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
            get('i', callback);
        },
        crag: function(cragName, callback) {
            storage.get(cragName, function(crag) {
                if (!crag) {
                    callback(null, { status: 404, data: 'The crag "' + cragName + '" does not exist.' });
                }
                else {
                    callback(unpackCrag(crag));
                }
            });
        },
        area: function(cragName, area, callback) {
            storage.get(cragName, function(crag) {
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
            storage.get(cragName, function(crag) {
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

    _.each(storage.checksums(), function(sum, key) {
        if (sum !== schema.checksums[key]) {
            storage.update(key);
        } else if (key === 'i') {
            db.index(key);
        } else  {
            db.crag(key)
        }
    });

    return db;
});