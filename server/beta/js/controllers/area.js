/**
 *
 */
beta.controller('AreaController', function AreaController($scope, $routeParams, database) {
    'use strict';

    database.area($routeParams.crag, $routeParams.area, function(area, error) {
        $scope.area = area;
        $scope.error = error;
    });
});