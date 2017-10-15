/**
 *
 */
beta.config(function($routeProvider, $locationProvider) {
    'use strict';

    $routeProvider.caseInsensitiveMatch = true;
    $routeProvider
    .when('/', {
        templateUrl: 'partials/help.html'
    })
    .when('/go', {
        templateUrl: 'partials/404.html',
        controller: '404Controller as ctrl'
    })
    .when('/:crag', {
        templateUrl: 'partials/crag.html',
        controller: 'CragController as ctrl'
    })
    .when('/:crag/a/:area', {
        templateUrl: 'partials/area.html',
        controller: 'AreaController as ctrl'
    })
    .when('/:crag/:route', {
        templateUrl: 'partials/route.html',
        controller: 'RouteController as ctrl'
    })
    .otherwise({
        templateUrl: 'partials/404.html',
        controller: '404Controller as ctrl'
    });

    $locationProvider.html5Mode(true);
});