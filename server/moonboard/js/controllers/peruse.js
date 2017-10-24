
/**
 *
 */
moon.controller('PeruseController', function PeruseController($timeout, $scope, $routeParams, moonboard, database, problems) {
    'use strict';

    $scope.problem = null;
    $scope.setter = null;
    $scope.problems = [];
    $scope.list = [];
    $scope.perpage = 15; // Number of problems to show at a time.
    $scope.i = 0; // Current problem index

    if ($routeParams.page) {
        var page = parseInt($routeParams.page);
        if (isNaN(page)) {
            $scope.error = $scope.error || { status: 404, data: '"' + $routeParams.page + '" is not a page number.' };
            return;
        }
        $scope.i = $routeParams.page * $scope.perpage;
    }
    
    var grade = $routeParams.grade.toUpperCase();
    if (grade === 'ALL') {
        grade = false;
    } else {
        var vgrade = parseInt(grade.substring(1));
        if (grade.substring(0, 1) !== 'V' || isNaN(vgrade) || vgrade < 4 || vgrade > 17) {
            $scope.error = $scope.error || { status: 404, data: '"' + $routeParams.grade + '" is not a valid grade: must be V4-V17 or ALL.' };
            return;
        }
    }

    database.all(function(data, ticks) {
        $scope.data = data;

        // Build the master list of all problems for the current grade.
        problems.reset();
        var end = _.size(data.p);
        _.each(data.i, function(problem, index) {
            if (index < end && (!grade || problem.g === grade)) {
                if (/*include ticks || */ !ticks.hasOwnProperty(index)) {
                    $scope.problems.push(index);
                    problems.push(problem);
                }
            }
        });
        if ($scope.problems.length === 0) {
            $scope.error = $scope.error || { status: 404, data: 'Did not find any ' + $routeParams.grade + ' problems.' };
            return;
        }
        moonboard.load().then(
            function() {
                update(Math.min($scope.i, $scope.problems.length - 1));
            },
            function() {
                $scope.error = $scope.error || { status: 500, da2ta: 'Failed to load Moonboard' };
            }
        );
    }, $scope);

    function update(i) {
        $scope.i = i;
        $scope.problem = $scope.data.i[$scope.problems[$scope.i]];
        moonboard.set($scope.problem.h);
        $scope.setter = $scope.data.i[$scope.problem.e];
        
        $scope.list = [];
        var start = Math.min($scope.i, $scope.problems.length - $scope.perpage - 1);
        var indices = _.slice($scope.problems, start, start + $scope.perpage);
        _.each(indices, function(index) {
            $scope.list.push($scope.data.i[index]);
        });
    }

    $scope.ppage = function (event) {
        update(Math.max($scope.i - $scope.perpage, 0));
    };
    $scope.prev = function (event) {
        if ($scope.i > 0) {
            update($scope.i-1);
        }
    };
    $scope.rand = function (event) {
        update(Math.floor(Math.random() * $scope.problems.length));
    };
    $scope.next = function (event) {
        if ($scope.i < ($scope.problems.length - 1)) {
            update($scope.i+1);
        }
    };
    $scope.npage = function (event) {
        update(Math.min($scope.i + $scope.perpage, $scope.problems.length - 1));
    };
});
