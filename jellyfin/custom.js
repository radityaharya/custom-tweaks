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

async function anilistAPI(aid) {
    var query = `
    query ($id: Int) { # Define which variables will be used in the query (id)
      Media (id: $id, type: ANIME) { # Insert our variables into the query arguments (id) (type: ANIME is hard-coded in the query)
        id
        bannerImage
        episodes
        duration
        averageScore
        isAdult
        nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
        }
        staff {
            edges {
                role
                node {
                    name {
                        full
                    }
                    id
                    siteUrl
                }
            }
        }
      }
    }
    `;

    var variables = {
        id: aid
    };

    var url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}

var getId = function () {
    id = window.location.href.substring(window.location.href.lastIndexOf('/') + 1).substring(0, window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('&')).substring(window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('=') + 1);
    return id;
}

function addStatus(item) {
    var itemMiscInfo = document.querySelectorAll('#itemDetailPage:not(.hide) .itemMiscInfo-primary');
    item.then(function (data) {
        var status = data["Status"];
        if (status) {
            var statusElement = document.createElement("div");
            statusElement.className = "mediaInfoItem";
            statusElement.innerHTML = '<div class="mediaInfoValue status">' + status + '</div>';
            var color = function () {
                switch (status) {
                    case "Ended":
                        return "red";
                    case "Continuing":
                        return "green";
                    default:
                        return "grey";
                }
            }
            statusElement.style = "background-color: " + color() + "; color: white; border-radius: 5px; padding: 0px 5px 0px 5px; margin-left: 5px;";
            if (itemMiscInfo[itemMiscInfo.length - 1].getElementsByClassName("status").length == 0) {
                itemMiscInfo[itemMiscInfo.length - 1].prepend(statusElement);
            }
        }
    });
}

function addStaff(item) {
    item.then(function (data) {
        if (data["ProviderIds"]["AniList"]) {
            anilistAPI(data["ProviderIds"]["AniList"]).then(function (anidata) {
                var itemDetailsGroups = document.querySelectorAll('#itemDetailPage:not(.hide) .itemDetailsGroup');
                if (itemDetailsGroups[0].querySelectorAll("#itemDetailPage:not(.hide) .directorsGroup:not(.hide)").length > 0) {
                    return;
                }
                console.log(anidata);
                var stafItems = anidata["data"]["Media"]["staff"]["edges"];
                for (var i = 0; i < stafItems.length; i++) {
                    if (stafItems[i]["role"] != "Director" && stafItems[i]["role"] != "Original Creator") {
                        continue;
                    }
                    var detailsGroupItem = document.createElement("div");
                    detailsGroupItem.className = "detailsGroupItem directorsGroup";
                    var directorsLabel = document.createElement("div");
                    directorsLabel.className = "directorsLabel label";
                    directorsLabel.innerHTML = stafItems[i]["role"];
                    var directorsValue = document.createElement("div");
                    directorsValue.className = "directors content focuscontainer-x";
                    directorsValue.innerHTML = stafItems[i]["node"]["name"]["full"];
                    directorsValue.style = "cursor: pointer;";
                    directorsValue.setAttribute("onclick", "window.open('" + stafItems[i]["node"]["siteUrl"] + "', '_blank')");
                    detailsGroupItem.appendChild(directorsLabel);
                    detailsGroupItem.appendChild(directorsValue);
                    itemDetailsGroups[0].appendChild(detailsGroupItem);
                }
            });
        }
    });
}

const copyTextContent = function (element) {
    var text = element.textContent;
    navigator.clipboard.writeText(text);
}

var isPageReady = async function () {
    while (true) {
        await new Promise(r => setTimeout(r, 500));
        if (pageLocation() == "details") {
            try {
                if (document.querySelectorAll('#itemDetailPage:not(.hide) .mediaInfoItem').length > 0) {
                    console.log("CUSTOM: page ready");
                    return true;
                }
            }
            catch (error) {

            }
        }
        await new Promise(r => setTimeout(r, 500));
    }
}

function detailsPageScripts() {
    console.log("CUSTOM: details page scripts");
    parentNameLast = document.getElementsByClassName("infoText");
    for (var i = 0; i < parentNameLast.length; i++) {
        parentNameLast[i].addEventListener("click", function () {
            copyTextContent(this);
        });
    }
    var item = JellyfinApi('/Users/' + userId + '/Items/' + getId(), 'GET');
    addStatus(item);
    addStaff(item);
}

var previousUrlWithQuery = window.location.href;
var observer = new MutationObserver(function (mutations) {
    if (window.location.href != previousUrlWithQuery) {
        console.log('CUSTOM:query parameter changed');
        previousUrlWithQuery = window.location.href;
        isPageReady().then(function () {
            if (pageLocation() == "details") {
                detailsPageScripts();
            }
        }
        );
    }
});
observer.observe(document, { subtree: true, childList: true });



window.onload = function () {
    console.log('CUSTOM:window loaded');
    isPageReady().then(function () {
        if (pageLocation() == "details") {
            detailsPageScripts();
        }
    });
}

// detect ctrl + f and click on search button
window.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        action("Search");
    }
}, false);