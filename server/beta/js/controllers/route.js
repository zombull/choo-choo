/**
 *
 */
beta.controller('RouteController', function RouteController($scope, $routeParams, database) {
    'use strict';

    database.route($routeParams.crag, $routeParams.route, function(route, error) {
        $scope.route = route;
        $scope.error = $scope.error || error;

        if (!error) {
            // $scope.grade = (route.grade.yds ? route.grade.yds : route.grade.hueco) + (route.mod ? ' ' + route.mod : ''); // + ' / ' + route.grade.font;
            scope.grade = route.g

            database.area($routeParams.crag, route.area.url.split("/").pop(), function(area, error) {
                $scope.area = area;
                $scope.error = $scope.error || error;
            });
        }
    });
});