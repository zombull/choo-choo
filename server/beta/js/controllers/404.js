/**
 *
 */
beta.controller('404Controller', function FourOhFourController($scope, $location, database) {
    'use strict';

    if ($location.path().split('/')[1].toLowerCase() === 'go') {
        if ($location.search().q) {
            $scope.error = {
                status: 404,
                statusText: 'Not Found',
                data: 'The query "{0}" did not match any crags, areas or routes.'.format($location.search().q)
            };
        }
        else {
            $scope.error = {
                status: 400,
                statusText: 'Bad Request',
                data: 'Query must be specified for /go via the \'q\' parameter.'
            };
        }
    }
    else {
        $scope.error = {
            status: 404,
            statusText: 'Not Found',
            data: '"' + $location.url() + '" is not a valid URL.'
        };
    }
});