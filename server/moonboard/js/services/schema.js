moon.factory('schema', function () {
    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { master: { local: true }, ticks: { local: true } };
    var checksums = { master: '15589311b1497a554f97d8fc9cae2027', ticks: '5ceb18f103af4e983243229116e9a1d4' };
    
    return {
        requests: requests,
        metadata: metadata,
        subdomains: subdomains,
        checksums: checksums,
    };
});