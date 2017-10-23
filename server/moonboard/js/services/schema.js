moon.factory('schema', function () {
    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { master: { local: true }, ticks: { local: true } };
    var checksums = { master: 'b6c6ff61cf679daf98d8c36275d4ac0e', ticks: '5ceb18f103af4e983243229116e9a1d4' };
    
    return {
        requests: requests,
        metadata: metadata,
        subdomains: subdomains,
        checksums: checksums,
    };
});