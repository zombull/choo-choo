beta.factory('schema', function () {
    
        'use strict';
    
        var requests = {};
    
        var subdomains = {};
        var metadata = { i: { local: true } };
        var checksums = {'i':'ff9048db82bc21bc6993b5ece1330fe1','buttermilks':'6fb24014363d2ba08b2e54ebdf843b7c','happyboulders':'6d7844b2ac284343868dc911b7444a73','joshuatree':'0800ef3bd41d083b0ce304bccbdd3100','klingerspring':'58c53a6eef24ddb0b2fab36493ce174b','mtcharleston':'159e7e8bd29d1a22b905a394988fb4f0','owensrivergorge':'bc9f79e7e764609895884a4974ae141d','redrivergorge':'d4626f643e82502b0d971f03eee1d742','redrock':'186d0c98a8fbf300255f9afea088eba2','sadboulders':'b6e5d9138ad83f8188c9f45cb752c711','smithrock':'f71f9c9520a82525bf5c6bd092934295','yosemitevalley':'653e482bd250d3fcf2931f6ea895de4b'};
        
        function addCrag(subdomain, name) {
            metadata[name] = { subdomain: subdomain };
    
            if (!subdomains.hasOwnProperty(subdomain)) {
                subdomains[subdomain] = {};
            }
        }
        addCrag('northwest', 'klingerspring');
        addCrag('northwest', 'smithrock');
    
        addCrag('southwest', 'redrock');
        addCrag('southwest', 'mtcharleston');
    
        addCrag('southeast', 'redrivergorge');
    
        addCrag('norcal', 'buttermilks');
        addCrag('norcal', 'happyboulders');
        addCrag('norcal', 'sadboulders');
        addCrag('norcal', 'owensrivergorge');
        addCrag('norcal', 'yosemitevalley');
    
        addCrag('socal', 'joshuatree');
    
        return {
            requests: requests,
            metadata: metadata,
            subdomains: subdomains,
            checksums: checksums,
         };
});