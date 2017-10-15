beta.filter('stats', function($sce) {
    return function(stats) {
        return $sce.trustAsHtml('<td>' + stats.count + '</td><td>' + stats.name + '</td>');
    };
});