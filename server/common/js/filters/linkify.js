host.filter('linkify', function($sce) {

    'use strict';

    return function(entry, external) {
        var meta = '';
        // if (entry.grade) {
        //     meta = '<i>&nbsp;&nbsp;({0})</i>'.format((entry.grade.yds ? entry.grade.yds : entry.grade.hueco) + (entry.mod ? ('&nbsp;' + entry.mod ) : ''));
        // }
        if (entry.hasOwnProperty('g')) {
            meta = '<i>&nbsp;&nbsp;({0})</i>'.format(entry.g);
        }
        var html = '<a href="{0}"{3}>{1}{2}</a>'.format(entry.u, entry.n, meta, external ? ' target="_blank"' : '');
        return $sce.trustAsHtml(html);
    };
});
