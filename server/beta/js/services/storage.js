beta.factory('storage', function ($q) {

    'use strict';

    var requests = {};

    var subdomains = {};
    var metadata = { index: { local: true, name: 'index' } };

    function addCrag(subdomain, name) {
        metadata['crag/' + name] = { subdomain: subdomain, name: name };

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


    // The iframe may not be listening for our first event, even if we wait until onload,
    // as being loaded does not mean it has run its initial script code.  Wait for a ping
    // from the subdomain, using a promise to track when the subdomain is ready.  Then()
    // callbacks are invoked in the order they are attached, so we can create postMessage
    // in this dedicated code, allowing pending requests to assume postMessage is valid
    // once the promise is resolved.
    _.each(subdomains, function(subdomain, name) {
        subdomain.ping = $q.defer();
        subdomain.pong = subdomain.ping.promise;
        subdomain.pong.then(
            function(source) {
                subdomain.window = document.getElementById(name).contentWindow;
                subdomain.postMessage = function(message) {
                    this.window.postMessage(message, 'http://' + name + '.zombull.xyz:3000');
                };
                subdomain.postMessage('pong');
            },
            function() {
                // Completely hosed if the ping is somehow rejected.
                console.log('fudge');
            }
        );
    });

    function onMessage(event) {
        var match = event.origin.match(/^http:\/\/(\w*)\.zombull\.xyz:3000$/);
        if (match && subdomains.hasOwnProperty(match[1])) {
            if (event.data === 'ping') {
                if (!subdomains[match[1]].postMessage) {
                    subdomains[match[1]].ping.resolve();
                }
            }
            else {
                if (requests.hasOwnProperty(event.data.name)) {
                    _.each(requests[event.data.name], function(request) {
                        if (event.data.value) {
                            request.resolve(event.data.value);
                        }
                        else {
                            request.reject();
                        }
                    });
                    delete requests[event.data.name];
                }
            }
        }
    }
    window.addEventListener('message', onMessage, false);

    function postMessage(subdomain, message, request) {
        if (subdomains[subdomain].postMessage) {
            subdomains[subdomain].postMessage(message);
        }
        else {
            subdomains[subdomain].pong.then(
                function(source) {
                    subdomains[subdomain].postMessage(message);
                },
                function() {
                    // Completely hosed if the ping is somehow rejected.
                    console.log('fudge');
                }
            );
        }
    }

    // Testing without subdomains, e.g. on phone.
    // _.each(metadata, function(entry) {
    //     entry.local = true;
    // });

    return {
        get: function(key) {
            var request = $q.defer();
            if (!metadata.hasOwnProperty(key)) {
                request.reject(true);
            }
            else {
                var name = metadata[key].name;
                if (metadata[key].local) {
                    var local = localStorage.getItem(name);
                    if (local) {
                        request.resolve(local);
                    }
                    else {
                        request.reject();
                    }
                }
                else {
                    if (requests.hasOwnProperty(name)) {
                        requests[name].push(request);
                    }
                    else {
                        requests[name] = [];
                        requests[name].push(request);

                        postMessage(metadata[key].subdomain, { method: 'get', name: name });

                        // Don't really want to fall back to the server, this code needs to be rock solid.
                        // $timeout(request.reject());
                    }
                }
            }
            return request.promise;
        },

        set: function(key, value) {
            if (metadata.hasOwnProperty(key)) {
                var name = metadata[key].name;
                if (metadata[key].local) {
                    localStorage.setItem(name, value);
                }
                else {
                    postMessage(metadata[key].subdomain, { method: 'set', name: name, value: value });
                }
            }
        }
    };
});