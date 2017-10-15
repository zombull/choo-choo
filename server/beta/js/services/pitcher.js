beta.factory('pitcher', function () {

    'use strict';

    return function(min, max) {
        min = min || 0;
        max = max || 1000;

        return function(pitches) {
            return pitches >= min && pitches <= max;
        };
    };
});