moon.factory('schema', function () {
    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { master: { local: true } };
    var checksums = { master: 'be85c06e2127df30adf47d6146903b95' };
    
    return {
        requests: requests,
        metadata: metadata,
        subdomains: subdomains,
        checksums: checksums,
    };
});