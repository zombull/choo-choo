beta.factory('typist', function () {

    'use strict';

    return function(one, two) {

        var antiOne = one[0] === '!';
        one = one.slice(1);

        if (two) {
            var antiTwo = two[0] === '!';
            two = two.slice(1);

            if (!antiOne && !antiTwo) {
                return function(types) {
                    return (types && (types.indexOf(one) !== -1) && (types.indexOf(two) !== -1));
                };
            }
            else if (!antiOne && antiTwo) {
                return function(types) {
                    return (types && (types.indexOf(one) !== -1) && (types.indexOf(two) === -1));
                };
            }
            else if (antiOne && !antiTwo) {
                return function(types) {
                    return (types && (types.indexOf(one) === -1) && (types.indexOf(two) !== -1));
                };
            }
            else { // antiOne && antiTwo
                return function(types) {
                    return (types && (types.indexOf(one) === -1) && (types.indexOf(two) === -1));
                };
            }
        }
        else {
            if (!antiOne) {
                return function(types) {
                    return (types && (types.indexOf(one) !== -1));
                };
            }
            else {
                return function(types) {
                    return (types && (types.indexOf(one) === -1));
                };
            }
        }
    };
});