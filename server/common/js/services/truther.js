host.factory('truther', function () {
    'use strict';

    return function(val) {
        if (val === null) {
            return val
        }
        return val === '!' ? false : true;
    };
});