moon.factory('problems', function () {
    'use strict';

    var problems = [];

    return {
        get: function() {
            return problems;
        },
        set: function(p) {
            problems = p;
        },
        push: function(p) {
            problems.push(p);
        },
        reset: function() {
            problems = [];
        }
    };
});