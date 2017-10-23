beta.factory('shortcuts', function () {

    'use strict';

    var crags = {
        g: 'global',
        bu: 'buttermilks',
        hb: 'happyboulders',
        jt: 'joshuatree',
        ks: 'klingerspring',
        or: 'owensrivergorge',
        sm: 'smithrock',
        rr: 'redrock',
        sb: 'sadboulders',
        red: 'redrivergorge',
        mc: 'mtcharleston',
        yv: 'yosemitevalley',

        // ec: 'eldoradocanyon',
        // ri: 'rifle',
        // in: 'index',
    };

    var shortcuts = {};
    _.each(crags, function(crag, shortcut) {
        shortcuts[crag] = shortcut;
    });

    var methods = {
        crag: function(shortcut) {
            if (crags.hasOwnProperty(shortcut)) {
                return crags[shortcut];
            }
            return undefined;
        },
        shortcut: function(crag) {
            if (shortcuts.hasOwnProperty(crag)) {
                return shortcuts[crag];
            }
            return undefined;
        }
    };
    return methods;
});

