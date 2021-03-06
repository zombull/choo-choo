/**
 * Air Traffic Controller
 */
moon.controller('AirTrafficController', function AirTrafficController(database, problems) {
    'use strict';

    database.all(function(data) {
        problems.set(_.slice(data.i, 0, _.size(data.p)));
    });
});
