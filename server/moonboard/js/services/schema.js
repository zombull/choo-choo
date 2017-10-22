moon.factory('schema', function () {
    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { master: { local: true } };
    var checksums = { master: 'a6acf83c651d8a626eeacd3a5ccb3944' };
    
    return {
        requests: requests,
        metadata: metadata,
        subdomains: subdomains,
        checksums: checksums,
    };
});