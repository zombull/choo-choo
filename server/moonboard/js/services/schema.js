moon.factory('schema', function () {
    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { master: { local: true }, ticks: { local: true } };
    var checksums = { master: 'a351c6feb5571519008677950b930cb7', ticks: 'a2be6d2b5d52bdc489fe96bdc7edb3e1' };
    
    return {
        requests: requests,
        metadata: metadata,
        subdomains: subdomains,
        checksums: checksums,
    };
});