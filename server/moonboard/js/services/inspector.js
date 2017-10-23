moon.factory('inspector', function ($location, $q, database, calculator, grader, truther) {
    'use strict';

    var filter = function(options, data, ticks) {
        if (options.query || options.setby || options.setter || options.grade ||
            options.ascents || options.stars || options.benchmark !== null || options.ticked !== null) {
            options.query = options.query.replace(/^\s+/, '');

            return data.filter(function(entry) {
                return  (!options.query || entry.l.indexOf(options.query) !== -1) &&
                        (!options.setter || !entry.hasOwnProperty('g') && entry.l.indexOf(options.setter) !== -1) &&
                        (!options.setby || entry.hasOwnProperty('e') && options.setby.hasOwnProperty(entry.e)) &&
                        (!options.grade || entry.hasOwnProperty('v') && options.grade(entry.v)) &&
                        (options.benchmark === null || entry.hasOwnProperty('b') === options.benchmark) &&
                        (options.ticked === null && !ticks.hasOwnProperty(entry.i) || options.ticked || options.ticked === false && ticks.hasOwnProperty(entry.i)) &&
                        (!options.ascents || entry.hasOwnProperty('a') && options.ascents(entry.a)) &&
                        (!options.stars || entry.hasOwnProperty('s') && options.stars(entry.s));
            });
        }
        return data;
    };

    var regExs = {
        setby: /\s+@@(\w+)/,
        setter: /\s+@(\w+)/,
        grade: /\s+=(v1\d|v\d)/,
        minGrade: /\s+>(v1\d|v\d)/,
        maxGrade: /\s+<(v1\d|v\d)/,
        ascents: /\s+a=(\d+)/,
        minAscents: /\s+a>(\d+)/,
        maxAscents: /\s+a<(\d+)/,
        stars: /\s+s=(\d+)/,
        minStars: /\s+s>(\d+)/,
        maxStars: /\s+s<(\d+)/,
        benchmark: /\s+(\!|\\)b/,
        ticked: /\s+(\!|\\)t/,
    };

    function processRegEx(options, regEx) {
        var match = options.query.match(regEx);
        if (match) {
            options.query = options.query.replace(regEx, '');
            return match[1].toLowerCase();
        }
        return null;
    }

    return {
        search: function (query) {
            var deferred = $q.defer();
            var autoclear = false;
            if (query) {
                var min, max;
                var options = { query: ' ' + query.toLowerCase() };

                options.setby = processRegEx(options, regExs.setby);
                options.setter = processRegEx(options, regExs.setter);
                
                min = max = processRegEx(options, regExs.grade);
                if (!min) {
                    min = processRegEx(options, regExs.minGrade);
                    max  = processRegEx(options, regExs.maxGrade);
                }
                if (min || max) {
                    options.grade = grader(min, max);
                }

                min = max = processRegEx(options, regExs.ascents);
                if (!min) {
                    min = processRegEx(options, regExs.minAscents);
                    max = processRegEx(options, regExs.maxAscents);
                }
                if (min || max) {
                    options.ascents = calculator(min, max);
                }

                min = max = processRegEx(options, regExs.stars);
                if (!min) {
                    min = processRegEx(options, regExs.minStars);
                    max = processRegEx(options, regExs.maxStars);
                }
                if (min || max) {
                    options.stars = calculator(min, max);
                }

                options.benchmark = truther(processRegEx(options, regExs.benchmark));
                options.ticked = truther(processRegEx(options, regExs.ticked));

                database.all(function(data, ticks, error) {
                    if (options.setby) {
                        var setby = options.setby;
                        options.setby = {}
                        _.each(data.s, function(id, key) {
                            if (key === '' || key.indexOf(setby) !== -1) {
                                options.setby[id] = true;
                            }
                        });
                    }
                    deferred.resolve(filter(options, data.i, ticks));
                });
            }
            else {
                database.master(function(data, error) {
                    if (error) {
                        console.log(error);
                    } else {
                        deferred.resolve(data.i);
                    }
                });
            }
            return deferred.promise;
        },
        autoclear: function(query) {
            var clear = true;
            var options = { query: ' ' + query.toLowerCase() };
            _.each(regExs, function(regex) {
                    if (clear && processRegEx(options, regex)) {
                        clear = false;
                    }
            });
            return clear;
        }
    };
});