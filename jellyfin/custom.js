//@radityaharya
// still dunno whut to do with this, probably will be used to add custom elements to the page
var credentials = JSON.parse(localStorage.getItem('jellyfin_credentials'));
var accessToken = credentials["Servers"][0]["AccessToken"];
var userId = credentials["Servers"][0]["UserId"];
var deviceId = Object.keys(localStorage).filter(function (key) { return key.indexOf("deviceId") > -1; })[0]; deviceId = localStorage.getItem(deviceId);
var server = window.location.origin;

function pageLocation() {
    var locations = {
        "home": "/web/index.html#!/home.html",
        "movies": "/web/index.html#!/movies.html",
        "tvshows": "/web/index.html#!/tv.html",
        "music": "/web/index.html#!/music.html",
        "details": "/web/index.html#!/details"
    };
    var location = window.location.href;
    switch (true) {
        case location.indexOf(locations["home"]) > -1:
            return "home";
        case location.indexOf(locations["movies"]) > -1:
            return "movies";
        case location.indexOf(locations["tvshows"]) > -1:
            return "tvshows";
        case location.indexOf(locations["music"]) > -1:
            return "music";
        case location.indexOf(locations["details"]) > -1:
            return "details";
        default:
            return "home";
    }
}


async function JellyfinApi(endpoint, method, data) {
    var url = server + endpoint;
    var xEmbyAuth = 'MediaBrowser Client="Jellyfin Web", Device="Chrome", DeviceId="' + deviceId + '", Token="' + accessToken + '"';
    var headers = {
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'X-Emby-Authorization': xEmbyAuth,
        'accept': 'application/json'
    };
    if (method == 'POST') {
        headers['Content-Type'] = 'application/json';
    }
    var options = {
        method: method,
        headers: headers
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    const data_1 = await response.json();
    return data_1;
};

var getId = function () {
    id = window.location.href.substring(window.location.href.lastIndexOf('/') + 1).substring(0, window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('&')).substring(window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('=') + 1);
    return id;
}

function getTitles() {
    if (pageLocation() == "details") {
        item = JellyfinApi('/Users/' + userId + '/Items/' + getId(), 'GET');
        console.log("CUSTOM: making request to: " + '/Users/' + userId + '/Items/' + getId());
        item.then(function (data) {
            // alert(data["Name"]);
        });
    }
}

window.onload = function () {
    console.log('CUSTOM:window loaded');
    setTimeout(function () {
        getTitles();
    }
        , 5000);
}

var previousUrlWithQuery = window.location.href;
var observer = new MutationObserver(function (mutations) {
    if (window.location.href != previousUrlWithQuery) {
        console.log('CUSTOM:query parameter changed');
        previousUrlWithQuery = window.location.href;
        setTimeout(function () {
            // functions to call when page loaded
            getTitles();
        }
            , 1000);
    }
});
observer.observe(document, { subtree: true, childList: true });

// detect ctrl + f and click on search button
window.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        action("Search");
    }
}, false);