beta.filter('length', function() {
    return function(route) {

        if (route.pitches && route.feet) {
            return (route.pitches === 1 ? '1 pitch, ' : route.pitches + ' pitches, ') + route.feet + ' feet';
        }
        else if (route.pitches) {
            return (route.pitches === 1 ? '1 pitch' : route.pitches + ' pitches');
        }
        return route.feet + ' feet';
    };
});