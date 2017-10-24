
/**
 *
 */
moon.controller('ProblemController', function ProblemController($scope, $routeParams, moonboard, database, problems) {
    'use strict';

    problems.reset();

    database.all(function(data, ticks) {
        var name = $routeParams.problem;
        if (!data.p.hasOwnProperty(name)) {
            $scope.error = $scope.error || { status: 404, data: 'The problem "' + name + '" does not exist.' };
            return;
        }
        problems.set(data.i);

        var me = data.p[name];
        var problem = data.i[me];
        var setter = data.i[problem.e];
        var grades = data.g[problem.v / 10];
        var suggested = { setter: [], grade: [] }
        _.each(setter.p, function(p) {
            if (p != me && suggested.setter.length < 10 && !ticks.hasOwnProperty(p)) {
                suggested.setter.push(data.i[p])
            }
        });
        _.each(grades, function(p) {
            if (p != me && (suggested.grade.length + suggested.setter.length) < 20 &&  !ticks.hasOwnProperty(p)) {
                suggested.grade.push(data.i[p])
            }
        });
        $scope.setter = setter;
        $scope.problem = problem;
        $scope.tick = ticks.hasOwnProperty(problem.i) ? ticks[problem.i] : null;
        $scope.suggested = suggested;
        
        moonboard.load().then(
            function() {
                moonboard.set(problem.h)
            },
            function() {
                $scope.error = $scope.error || { status: 500, data: 'Failed to load Moonboard' };
            }
        );
    }, $scope);
});

