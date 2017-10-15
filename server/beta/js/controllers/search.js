/**
 *
 */
beta.controller('SearchController', function SearchController($location, $q, $timeout, database, shortcuts, grader, pitcher, typist) {
    'use strict';

    var self = this;

    var FORWARD_SLASH = 191;
    var focusSearch = function(event) {
        // Make sure the user is not typing into an input.  No modifier is allowed.
        if (event.keyCode === FORWARD_SLASH && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && event.target.tagName.toLowerCase() !== 'input') {
            document.getElementById('search').focus();

            event.preventDefault();
            event.stopPropagation();
        }
    };
    window.addEventListener('keydown', focusSearch, false);

    var filter = function(options, data) {
        if (options.query || options.grader || options.pitcher || options.typist) {
            options.query = options.query.replace(/^\s+/, '');

            return data.filter(function(entry) {
                // var qb = (!options.query || entry.lname.indexOf(options.query) !== -1),
                //     tb = (!options.type || (entry.types && entry.types.indexOf(options.type) !== -1)),
                //     t2 = (!options.type2 || (entry.types && entry.types.indexOf(options.type2) !== -1)),
                //     gb = (!options.grader || options.grader(entry.grade)),
                //     pb = (!options.pitcher || options.pitcher(entry.pitches));
                //     return qb && tb && t2 && gb && pb;
                return  (!options.query || entry.lname.indexOf(options.query) !== -1) &&
                        (!options.grader || options.grader(entry.grade)) &&
                        (!options.pitcher || options.pitcher(entry.pitches)) &&
                        (!options.typist || options.typist(entry.types));
            });
        }
        return data;
    };

    var regExs = {
        crag: /\s+@(\w+)/,
        type: /\s+(\\|\?|\!|-)(s|t|a|r|b)/,
        grade: /\s+(5\.1\d[abcd]|5\.1\d|5\.\d|v1\d|v\d)(-|\+)?/,
        minGrade: /\s+>(5\.1\d[abcd]|5\.1\d|5\.\d|v1\d|v\d)(-|\+)?/,
        maxGrade: /\s+<(5\.1\d[abcd]|5\.1\d|5\.\d|v1\d|v\d)(-|\+)?/,
        pitches: /\s+p(\d+)/,
        minPitches: /\s+>p(\d+)/,
        maxPitches: /\s+<p(\d+)/
    };

    function processRegEx(options, regEx) {
        var match = options.query.match(regEx);
        if (match) {
            options.query = options.query.replace(regEx, '');
            return match[1].toLowerCase() + (match[2] ? match[2].toLowerCase() : '');
        }
        return null;
    }

    self.search = function (query) {

        var deferred = $q.defer();
        if (query) {

            var min, max;
            var options = { query: ' ' + query.toLowerCase() };

            min = processRegEx(options, regExs.type);
            max = processRegEx(options, regExs.type);
            if (min) {
                options.typist = typist(min, max);
            }

            min = max = processRegEx(options, regExs.grade);
            if (!min) {
                min = processRegEx(options, regExs.minGrade);
                max  = processRegEx(options, regExs.maxGrade);
            }
            if (min || max) {
                options.grader = grader(min, max);
            }

            min = max = processRegEx(options, regExs.pitches);
            if (!min) {
                min = processRegEx(options, regExs.minPitches);
                max = processRegEx(options, regExs.maxPitches);
            }
            if (min || max) {
                options.pitcher = pitcher(min, max);
            }

            var cragName = processRegEx(options, regExs.crag);
            if (cragName) {
                cragName = shortcuts.crag(cragName);
            }
            cragName = cragName || $location.path().split('/')[1];

            if (cragName && cragName !== 'global') {
                database.crag(cragName, function(crag) {
                    if (crag) {
                        deferred.resolve(filter(options, crag.index));
                    }
                    else {
                        database.index(function(data) {
                            deferred.resolve(filter(options, data));
                        });
                    }
                });
            }
            else {
                database.index(function(data) {
                    deferred.resolve(filter(options, data));
                });
            }
        }
        else {
            var currentCrag = $location.path().split('/')[1];
            if (currentCrag) {
                database.crag(currentCrag, function(crag) {
                    if (crag) {
                        deferred.resolve(crag.index);
                    }
                    else {
                        database.index(function(data) {
                            deferred.resolve(data);
                        });
                    }
                });
            }
            else {
                database.index(function(data) {
                    deferred.resolve(data);
                });
            }
        }
        return deferred.promise;
    };

    function clearSearch() {
        self.searchText = '';
    }

    var onFocus;
    onFocus = function(event) {
        // Clear the search text when the input is focused.  This needs to be done in $timeout,
        // adjusting searchText while Angular is doing its thing will make it think the selection
        // changed and Angular will display the list again and again and again.
        $timeout(clearSearch);

        // Remove the event handler, we want to preserve the user's input if the focus on something
        // else prior to selecting an element.
        document.getElementById('search').removeEventListener('focus', onFocus, false);
    };



    self.selectedItemChange = function(item) {
        if (item && item.url) {
            $location.path(item.url);

            // Focus on the main column to hide any soft keyboard.
            document.getElementById('main').focus();

            // Add the event handler to clear the input the next time it is focused.  Do this in
            // a timeout so that we don't try clearing the input until Angular has processed the
            // selection.
            $timeout(function() {
                document.getElementById('search').addEventListener('focus', onFocus, false);
            });
        }
    };
});