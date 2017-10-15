/**
 *
 */
beta.controller('CragController', function CragController($scope, $routeParams, database) {
    'use strict';

    database.crag($routeParams.crag, function(crag, error) {
        $scope.crag = crag;
        $scope.error = error;
    });
});