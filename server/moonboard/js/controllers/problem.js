
/**
 *
 */
moon.controller('ProblemController', function ProblemController($scope, $routeParams, moonboard, database) {
    'use strict';

    database.problem($routeParams.problem, function(problem, setter, tick, suggested, error) {
        $scope.setter = setter;
        $scope.problem = problem;
        $scope.tick = tick;
        $scope.suggested = suggested;
        
        $scope.error = $scope.error || error;
        if (!error) {
            moonboard.load().then(
                function() {
                    moonboard.set(problem.h)
                },
                function() {
                    $scope.error = $scope.error || { status: 500, data: 'Failed to load Moonboard' };
                }
            );
        }
    });
});

