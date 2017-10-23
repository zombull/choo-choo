host.filter('linkify', function($sce) {

    'use strict';

    return function(entry, external) {
        var target =  external ? ' target="_blank"' : '';
        var meta = entry.hasOwnProperty('g') ? '<i>&nbsp;&nbsp;({0})</i>'.format(entry.g) : '';
        var stars = ''
        if (entry.hasOwnProperty('g')) {
            stars = '&nbsp;&nbsp;'
            if (entry.hasOwnProperty('s')) {
                _.times(entry.s, function() {
                    stars += '&#x2605;';
                });
            } else {
                stars += '&#x2620;';
            }
        }
        var benchmark = entry.hasOwnProperty('b') && entry.b ? '&#x272a;&nbsp;' : '';
        // var html = '<a href="{0}"{3}>{5}{1}{2}{4}</a>'.format(entry.u, entry.n, meta, target, stars, benchmark);
        var html = '<a href="{0}"{1}>{2}{3}{4}{5}</a>'.format(entry.u, target, benchmark, entry.n, meta, stars, );
        return $sce.trustAsHtml(html);
    };
});
