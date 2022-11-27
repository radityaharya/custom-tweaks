//@radityaharya
var credentials = JSON.parse(localStorage.getItem('jellyfin_credentials'));
var accessToken = credentials["Servers"][0]["AccessToken"];
var userId = credentials["Servers"][0]["UserId"];
var deviceId = Object.keys(localStorage).filter(function (key) { return key.indexOf("deviceId") > -1; })[0]; deviceId = localStorage.getItem(deviceId);
var server = window.location.origin;
let heroHasRun = false;

function pageLocation() {
    var locations = {
        "home": "/web/index.html#!/home.html",
        "movies": "/web/index.html#!/movies.html",
        "tvshows": "/web/index.html#!/tv.html",
        "music": "/web/index.html#!/music.html",
        "details": "/web/index.html#!/details",
        "queue": "/web/index.html#!/queue"
    };
    var location = window.location.href;
    var page = "home";
    for (var key in locations) {
        if (location.indexOf(locations[key]) > -1) {
            page = key;
        }
    }
    return page;
};

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
    try {
        const response = await fetch(url, options);
        const data_1 = await response.json();
        return data_1;
    } catch (err) {
        console.log(err);
    }
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
};

var getId = function () {
    return window.location.href.substring(window.location.href.lastIndexOf('/') + 1).substring(0, window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('&')).substring(window.location.href.substring(window.location.href.lastIndexOf('/') + 1).indexOf('=') + 1);
};

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
            };
            statusElement.style = "background-color: " + color() + "; color: white; border-radius: 5px; padding: 0px 5px 0px 5px; margin-left: 5px;";
            if (itemMiscInfo && itemMiscInfo.length > 0 && itemMiscInfo[itemMiscInfo.length - 1].getElementsByClassName("status").length == 0) {
                itemMiscInfo[itemMiscInfo.length - 1].prepend(statusElement);
            }
        }
    }).catch(function (error) {
        console.log("Error: " + error);
    });
};

function addStaff(item) {
    item.then(function (data) {
        if (data["ProviderIds"]["AniList"]) {
            anilistAPI(data["ProviderIds"]["AniList"]).then(function (anidata) {
                var itemDetailsGroups = document.querySelectorAll('#itemDetailPage:not(.hide) .itemDetailsGroup');
                var stafItems = anidata["data"]["Media"]["staff"]["edges"];
                for (var i = 0; i < stafItems.length; i++) {
                    if (stafItems[i]["role"] != "Director" && stafItems[i]["role"] != "Original Creator") {
                        continue;
                    }
                    let detailsGroupItem = document.createElement("div");
                    detailsGroupItem.className = "detailsGroupItem directorsGroup";
                    let directorsLabel = document.createElement("div");
                    directorsLabel.className = "directorsLabel label";
                    directorsLabel.innerHTML = stafItems[i]["role"];
                    let directorsValue = document.createElement("div");
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
};

function addNextAiring(item) {
    item.then(function (data) {
        if (data["ProviderIds"]["AniList"]) {
            anilistAPI(data["ProviderIds"]["AniList"]).then(function (anidata) {
                let itemMiscInfo = document.querySelectorAll('#itemDetailPage:not(.hide) .itemMiscInfo-primary');
                let nextAiring = anidata["data"]["Media"]["nextAiringEpisode"];
                if (nextAiring) {
                    let timeUntilAiring = nextAiring["timeUntilAiring"];
                    let clientTime = new Date().getTime();
                    let airingAt = clientTime + timeUntilAiring * 1000;
                    let airingAtDate = new Date(airingAt);
                    let day = airingAtDate.toLocaleString('en-us', { weekday: 'long' });
                    let date = airingAtDate.toLocaleString('en-us', { day: 'numeric' });
                    let month = airingAtDate.toLocaleString('en-us', { month: 'long' });
                    let year = airingAtDate.toLocaleString('en-us', { year: 'numeric' });
                    let airingAtString = day + ", " + date + " " + month + " " + year + " " + airingAtDate.toLocaleTimeString();
                    let seriesAirTimeElement = document.querySelectorAll('#itemDetailPage:not(.hide) #seriesAirTime');
                    seriesAirTimeElement[0].innerHTML = "Next episode (episode " + nextAiring["episode"] + ")" + " is airing at " + "<span><strong>" + airingAtString + "</strong></span>";
                    seriesAirTimeElement.childList[0].querySelectorAll("a").remove();
                }
            });
        }
    });
};

function addFullscreenButton() {
    let nowPlayingSecondaryButtons = document.querySelectorAll('.nowPlayingSecondaryButtons');
    let fullscreenButton = createFullscreenButton();
    fullscreenButton.onclick = function () {
        toggleFullscreen();
    }
    if (nowPlayingSecondaryButtons[0].querySelectorAll(".fullscreenIcon").length == 0) {
        nowPlayingSecondaryButtons[0].prepend(fullscreenButton);
    }
};

function createFullscreenButton() {
    let fullscreenButton = document.createElement("button");
    fullscreenButton.className = "videoButton btnPlayStateCommand autoSize paper-icon-button-light"
    fullscreenButton.attributes = "is='paper-icon-button-light'";
    let icon = document.createElement("span");
    icon.className = "material-icons fullscreenIcon";
    icon.innerHTML = "fullscreen";
    fullscreenButton.appendChild(icon);
    return fullscreenButton;
};

function toggleFullscreen() {
    var elem = document.documentElement;
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

function addHero() {
    let heroContainerElement = document.querySelectorAll('#indexPage:not(.hide)');
    if (heroContainerElement.length == 0) {
        console.log('No indexPage');
        return;
    }
    heroContainerElement = heroContainerElement[0];
    if (heroContainerElement.querySelectorAll(".heroContainer").length != 0) {
        console.log('Hero container already exists');
        return;
    }
    let heroContainer = createHeroContainer();
    heroContainerElement.prepend(heroContainer);
}

function createHeroContainer() {
    let heroContainer = document.createElement("div");
    heroContainer.className = "heroContainer";
    let heroBackground = document.createElement("img");
    heroBackground.className = "heroBackground";
    let heroBackgroundContainer = document.createElement("div");
    heroBackgroundContainer.className = "heroBackgroundContainer";
    let heroContent = document.createElement("div");
    heroContent.className = "heroContent padded-left";
    let heroLogo = document.createElement("div");
    heroLogo.className = "heroLogo";
    let heroLogoImage = document.createElement("img");
    heroLogoImage.className = "heroLogoImage";
    heroLogo.appendChild(heroLogoImage);
    let heroTitle = document.createElement("div");
    heroTitle.className = "heroTitle";
    let heroDescription = document.createElement("div");
    heroDescription.className = "heroDescription";
    let buttonContainer = document.createElement("div");
    buttonContainer.className = "buttonContainer";
    let heroButton = document.createElement("button");
    heroButton.className = "raised emby-button heroButton";
    heroButton.innerHTML = "Watch Now";
    heroContent.appendChild(heroLogo);
    buttonContainer.appendChild(heroButton);
    heroContent.appendChild(heroTitle);
    heroContent.appendChild(heroDescription);
    heroContent.appendChild(buttonContainer);
    heroContainer.appendChild(heroContent);
    heroContainer.prepend(heroBackgroundContainer);
    return heroContainer;
};

const copyTextContent = function (element) {
    var text = element.textContent;
    navigator.clipboard.writeText(text);
};

var isPageReady = async function () {
    while (true) {
        if (pageLocation() == "details") {
            if (document.querySelectorAll('#itemDetailPage:not(.hide) .mediaInfoItem').length > 0) {
                return true;
            }
        } if (pageLocation() == "home") {
            if (document.querySelectorAll('.sectionTitle').length > 0) {
                return true;
            }
        }
        else {
            if (document.querySelectorAll('.nowPlayingEpisode').length > 0) {
                return true;
            }
        }
        await new Promise(r => setTimeout(r, 500));
    }
};

function detailsPageScripts() {
    console.log("CUSTOM: details page scripts");
    let parentNameLast = document.getElementsByClassName("infoText");
    for (var i = 0; i < parentNameLast.length; i++) {
        parentNameLast[i].addEventListener("click", function () {
            copyTextContent(this);
        });
    }
    var item = JellyfinApi('/Users/' + userId + '/Items/' + getId(), 'GET');
    addStatus(item);
    addStaff(item);
    addNextAiring(item);
};

async function homePageScripts() {
    console.log("CUSTOM: home page scripts");
    let latestShows = await JellyfinApi('/Users/' + userId + '/Items/Latest?Limit=10&Recursive=true&IncludeItemTypes=Series&Fields=Id', 'GET');
    let series = [];
    for (let i = 0; i < latestShows.length; i++) {
        let show = await JellyfinApi('/Users/' + userId + '/Items/' + latestShows[i]["Id"] + '?&Fields=Id%2CName%2COverview%2CImageTags', 'GET');
        await series.push(show);
    }
    if (heroHasRun || document.querySelectorAll('#indexPage:not(.hide) .heroContainer').length > 0) {
        return;
    }
    addHero();
    let hasRun = true;
    var i = 1;
    while (true) {
        document.querySelectorAll(".heroBackground").forEach(function (element) {
            element.classList.add("hide");
        });
        try {
            var heroTitle = document.querySelector("#indexPage:not(.hide) .heroTitle");
            let heroDescription = document.querySelector("#indexPage:not(.hide) .heroDescription")
            let heroButton = document.querySelector("#indexPage:not(.hide) .heroButton");
            var heroLogoImage = document.querySelector("#indexPage:not(.hide) .heroLogoImage");
            heroTitle.innerHTML = series[i]["Name"];
            document.querySelector("#indexPage:not(.hide) .heroLogo").classList.remove("hide");
            heroTitle.classList.remove("noLogo");
            heroDescription.innerHTML = series[i]["Overview"];
            if (series[i]["ImageTags"]["Logo"]) {
                heroLogoImage.src = server + "/Items/" + series[i]["Id"] + "/Images/Logo?maxWidth=300&tag=" + series[i]["ImageTags"]["Logo"];
            } else {
                document.querySelector("#indexPage:not(.hide) .heroLogo").classList.add("hide");
                document.querySelector("#indexPage:not(.hide) .heroTitle").classList.add("noLogo");
            }
            let heroBackground = document.querySelector("#indexPage:not(.hide) .heroBackground");
            heroButton.onclick = function () {
                window.history.state.url = "/web/index.html#!/details?id=" + series[i]["Id"];
                window.history.pushState(window.history.state, "", "/web/index.html#!/details?id=" + series[i]["Id"]);
                window.history.go(0);
            }
        }
        catch (error) {
            console.log(error);
        }
        for (let j = 0; j < series.length; j++) {
            if (isPageReady()) {
                let temp = document.createElement("img");
                temp.className = "heroBackground hide";
                temp.src = server + "/Items/" + series[j]["Id"] + "/Images/Backdrop?maxWidth=1920&tag=" + series[j]["ImageTags"]["Backdrop"] + "&quality=50";
                temp.id = series[j]["BackdropImageTags"];
                if (document.querySelectorAll("#indexPage:not(.hide) .heroBackground").length < series.length) {
                    document.querySelector("#indexPage:not(.hide) .heroBackgroundContainer").appendChild(temp);
                }
                    
            }
        }
        document.querySelectorAll("[id='" + series[i]["BackdropImageTags"] + "']").forEach(function (element) {
            element.classList.remove("hide");
        });
        console.log(i);
        await new Promise(r => setTimeout(r, 5000));
        if (i == series.length - 1) {
            i = 0;
        } else {
            i++;
        }
    }
};

function queuePageScripts() {
    console.log("CUSTOM: queue page scripts");
    addFullscreenButton();
};

var previousUrlWithQuery = window.location.href;
var observer = new MutationObserver(function (mutations) {
    if (window.location.href != previousUrlWithQuery) {
        console.log('CUSTOM:query parameter changed');
        previousUrlWithQuery = window.location.href;
        console.log(window.location.href);
        isPageReady().then(function () {
            if (pageLocation() == "details") {
                detailsPageScripts();
            }
            else if (pageLocation() == "queue") {
                console.log("CUSTOM: queue page");
                queuePageScripts();
            } else if (pageLocation() == "home") {
                homePageScripts();
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
        } else if (pageLocation() == "home") {
            homePageScripts();
        }
    });
};

// detect ctrl + f and click on search button
window.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        document.querySelector('[title="Search"]').click();
    }
}, false);