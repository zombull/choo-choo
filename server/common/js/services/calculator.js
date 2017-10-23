host.factory('calculator', function () {
    'use strict';

    return function(min, max) {
        min = min || 0;
        max = max || 1000;

        return function(val) {
            return val >= min && val <= max;
        };
    };
});