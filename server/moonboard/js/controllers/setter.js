
/**
 *
 */
moon.controller('SetterController', function SetterController($scope, $routeParams, moonboard, database, problems) {
    'use strict';

    problems.reset();

    $scope.problem = null;
    $scope.setter = null;
    $scope.tick = null;
    $scope.list = [];
    $scope.i = 0; // Current index into __problems

    var __problems = []; // Local list used as the source for problems.
    var __ticks = [];
    var perpage = 15;

    if ($routeParams.page) {
        var page = parseInt($routeParams.page);
        if (isNaN(page)) {
            $scope.error = $scope.error || { status: 404, data: '"' + $routeParams.page + '" is not a page number.' };
            return;
        }
        $scope.i = $routeParams.page * perpage;
    }

    database.all(function(data, ticks) {
        __ticks = ticks;

        var skey = 's/' + $routeParams.setter.toLowerCase();
        if (!data.s.hasOwnProperty(skey)) {
            $scope.error = $scope.error || { status: 404, data: 'Did not find a setter matching "' + $routeParams.setter + '"' };
            return;
        }

        $scope.setter = data.i[data.s[skey]];

        // Build the master list of all problems for the current grade.
        _.each($scope.setter.p, function(i) {
            // if (settings.showTicks || !ticks.hasOwnProperty(i)) {
                __problems.push(data.i[i])
            // }
        });
        if (__problems.length === 0) {
            $scope.error = $scope.error || { status: 404, data: 'Did not find any ' + $routeParams.grade + ' problems.' };
            return;
        }
        problems.set(__problems);

        moonboard.load().then(
            function() {
                update(Math.min($scope.i, __problems.length - 1));
            },
            function() {
                $scope.error = $scope.error || { status: 500, da2ta: 'Failed to load Moonboard' };
            }
        );
    }, $scope);

    function update(i) {
        $scope.i = i;
        $scope.problem = __problems[$scope.i];
        moonboard.set($scope.problem.h);
        $scope.tick = __ticks.hasOwnProperty($scope.problem.i) ? __ticks[$scope.problem.i] : null;

        $scope.list = [];
        var start = Math.min($scope.i, __problems.length - perpage - 1);
        $scope.list = _.slice(__problems, start, start + perpage);
    }

    $scope.ppage = function (event) {
        update(Math.max($scope.i - perpage, 0));
    };
    $scope.prev = function (event) {
        if ($scope.i > 0) {
            update($scope.i-1);
        }
    };
    $scope.rand = function (event) {
        update(Math.floor(Math.random() * __problems.length));
    };
    $scope.next = function (event) {
        if ($scope.i < (__problems.length - 1)) {
            update($scope.i+1);
        }
    };
    $scope.npage = function (event) {
        update(Math.min($scope.i + perpage, __problems.length - 1));
    };
});
