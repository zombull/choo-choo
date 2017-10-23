beta.filter('shortcut', function(shortcuts) {
    return function(crag) {
        return '@' + shortcuts.shortcut(crag);
    };
});