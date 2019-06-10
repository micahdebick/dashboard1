var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

// https://stackoverflow.com/a/43513777
function getParamsAsObject(query) {
    query = query.substring(query.indexOf('?') + 1);

    var re = /([^&=]+)=?([^&]*)/g;
    var decodeRE = /\+/g;

    var decode = function (str) {
        return decodeURIComponent(str.replace(decodeRE, " "));
    };

    var params = {}, e;
    while (e = re.exec(query)) {
        var k = decode(e[1]), v = decode(e[2]);
        if (k.substring(k.length - 2) === '[]') {
            k = k.substring(0, k.length - 2);
            (params[k] || (params[k] = [])).push(v);
        }
        else params[k] = v;
    }

    var assign = function (obj, keyPath, value) {
        var lastKeyIndex = keyPath.length - 1;
        for (var i = 0; i < lastKeyIndex; ++i) {
            var key = keyPath[i];
            if (!(key in obj))
                obj[key] = {}
            obj = obj[key];
        }
        obj[keyPath[lastKeyIndex]] = value;
    }

    for (var prop in params) {
        var structure = prop.split('[');
        if (structure.length > 1) {
            var levels = [];
            structure.forEach(function (item, i) {
                var key = item.replace(/[?[\]\\ ]/g, '');
                levels.push(key);
            });
            assign(params, levels, params[prop]);
            delete(params[prop]);
        }
    }
    return params;
};

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function element(id) { return document.getElementById(id); }

// Simulating vh an vw with rem: http://stackoverflow.com/questions/13948713/is-there-any-cross-browser-javascript-for-making-vh-and-vw-units-work
// But kindle 4 doesn't support rem (so all sizes are fixed fallback for kindle 4)
// Kindle 4 viewport: 600x706 (landscape 800x506) (in window.load event, window.resize event is not called)
// Paperwhite 3 viewport: 1072x1268 (in window.load event it is 0x0, in window.resized
function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
}

// ============================================================================

/**
 * http://www.ben-daglish.net/moon.shtml
 * @param year
 * @param month
 * @param day
 * @returns {number} They all return a single value - the phase day (0 to 1, where 0=new moon, 0.5=full etc.) for the selected date.
 * @constructor
 */
function getMoonPhase(year, month, day) {
    var lp = 2551443;
    var now = new Date(year, month - 1, day, 20, 35, 0);
    var new_moon = new Date(1970, 0, 7, 20, 35, 0);
    var phase = ((now.getTime() - new_moon.getTime()) / 1000) % lp;
    return phase / lp;
}

function getMoonPhaseFromDate(date) {
    var lp = 2551443;
    var new_moon = new Date(1970, 0, 7, 20, 35, 0);
    var phase = ((date.getTime() - new_moon.getTime()) / 1000) % lp;
    return phase / lp;
}

/**
 * @return {number} They all return a single value - the phase day (0 to 1, where 0=new moon, 0.5=full etc.) for the selected date.
 */
function getCurrentMoonPhase() {
    var now = new Date();
    return getMoonPhase(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

var moonIcons = [
    "wi-moon-alt-new",
    "wi-moon-alt-waxing-crescent-1",
    "wi-moon-alt-waxing-crescent-2",
    "wi-moon-alt-waxing-crescent-3",
    "wi-moon-alt-waxing-crescent-4",
    "wi-moon-alt-waxing-crescent-5",
    "wi-moon-alt-waxing-crescent-6",
    "wi-moon-alt-first-quarter",
    "wi-moon-alt-waxing-gibbous-1",
    "wi-moon-alt-waxing-gibbous-2",
    "wi-moon-alt-waxing-gibbous-3",
    "wi-moon-alt-waxing-gibbous-4",
    "wi-moon-alt-waxing-gibbous-5",
    "wi-moon-alt-waxing-gibbous-6",
    "wi-moon-alt-full",
    "wi-moon-alt-waning-gibbous-1",
    "wi-moon-alt-waning-gibbous-2",
    "wi-moon-alt-waning-gibbous-3",
    "wi-moon-alt-waning-gibbous-4",
    "wi-moon-alt-waning-gibbous-5",
    "wi-moon-alt-waning-gibbous-6",
    "wi-moon-alt-third-quarter",
    "wi-moon-alt-waning-crescent-1",
    "wi-moon-alt-waning-crescent-2",
    "wi-moon-alt-waning-crescent-3",
    "wi-moon-alt-waning-crescent-4",
    "wi-moon-alt-waning-crescent-5",
    "wi-moon-alt-waning-crescent-6",
];

function getMoonIcon(phase) {
    var iconInterval = 1 / moonIcons.length;
    return moonIcons[Math.floor(phase / iconInterval)];
}

// ============================================================================

function refreshCurrentWeather() {
    getJSON(
        "http://api.openweathermap.org/data/2.5/weather?" + getApiParams() + "&_timestamp=" + (new Date()).getTime(),
        function(err, data) { processCurrentWeather(data); },
    );
}

function processCurrentWeather(data) {
    element("icon").className = getIconClassName(data.weather[0], new Date(data.dt * 1000));
    element("temp").innerHTML = Math.round(data.main.temp);
    element("city").innerHTML = data.name;
    element("description").innerHTML = data.weather[0].description;
    element("lastUpdate").innerHTML = (
        moment(new Date(data.dt * 1000))
            .utcOffset(config.utcOffset)
            .format(config.timeFormat)
    );
    
    var sunrise = moment(new Date(data.sys.sunrise * 1000)).utcOffset(config.utcOffset);
    var sunset = moment(new Date(data.sys.sunset * 1000)).utcOffset(config.utcOffset);
    
    sunriseHour = sunrise.hour();
    sunsetHour = sunset.hour();

    sun.innerHTML = (
        "<i class='wi " + getMoonIcon(getCurrentMoonPhase()) + "'></i>" +
        "&nbsp;&nbsp;<i class='wi wi-sunrise'></i> " + sunrise.format(config.timeFormat) +
        "&nbsp;&nbsp;<i class='wi wi-sunset'></i> " + sunset.format(config.timeFormat)
    );
}

// ============================================================================

function refreshForecastWeather() {
    getJSON(
        "http://api.openweathermap.org/data/2.5/forecast?" + getApiParams() + "&_timestamp=" + (new Date()).getTime(),
        function(err, data) { processForecastWeather(data); }
    );
}

function processForecastWeather(data) {
    for (var i = 0; i < 4; i++) {
        var forecast = data.list[i];

        element("temp" + (i + 1)).innerHTML = Math.round(forecast.main.temp) + unitsSymbolHtml;
        element("icon" + (i + 1)).className = getIconClassName(forecast.weather[0], new Date(forecast.dt * 1000));
        element("desc" + (i + 1)).innerHTML = forecast.weather[0].description;
        element("time" + (i + 1)).innerHTML = (
            moment(new Date(forecast.dt * 1000))
                .utcOffset(config.utcOffset)
                .format(config.timeFormat)
        );
    }
}

// ============================================================================

function refreshDateTime() {
    element("date").innerHTML = moment().format("dd, ll");
    element("time").innerHTML = moment().format(config.timeFormat);
    setNightMode();
}

// ============================================================================

var version = null;

function refreshVersion() {
    getJSON(
        "./version.json",
        function(err, data) { processVersion(data); },
    );
}

function processVersion(data) {
    if (version != null) {
        if (version != data.version)
            location.reload();
    } else version = data.version;
}

// ============================================================================

var unitsSymbolHtml = "";

function getIconClassName(weather, date) {
    var isNight = weather.icon.slice(-1) === "n";
    if (isNight && weather.id == 800) {
        // Night clear -> real moon phase icon.
        var phase = getMoonPhaseFromDate(date);
        var icon = getMoonIcon(phase);
        return "wi " + icon;
    }

    return "wi wi-owm-" + (isNight ? "night-" : "day-") + weather.id;
}

function setsUnitsSymbolFromApiUrl(url) {
    if (url.indexOf("units=metric") >= 0) {
        unitsSymbolHtml = "<i class='wi wi-celsius'></i>";
        return;
    }

    if (url.indexOf("units=imperial") >= 0) {
        unitsSymbolHtml = "<i class='wi wi-fahrenheit'></i>";
        return;
    }

    unitsSymbolHtml = "<span>K</span>";
    return;
}

// ============================================================================
// API URL Parameters Generation
// ============================================================================

function getApiParams() {
    if (config.api.params) {
        var url = config.api.params;
        setsUnitsSymbolFromApiUrl(url)
        return url;
    }

    var locParams = config.api.locParams;
    if (config.city) {
        locParams = "q=" + encodeURIComponent(config.city);
    } else if (config.lat && config.lon) {
        locParams = "lat=" + encodeURIComponent(config.lat) + "&lon=" + encodeURIComponent(config.lon);
    }

    if (!locParams || !config.api.appId) return null;

    var url = "";
    if (locParams) url += locParams;
    if (config.api.appId) url += "&appid=" + config.api.appId;
    if (config.api.lang) url += "&lang=" + config.api.lang;
    if (config.api.units) url += "&units=" + config.api.units;

    setsUnitsSymbolFromApiUrl(url)
    return url;
}

// ============================================================================
// Rotation
// ============================================================================

var forcedRotation = false;

function rotate() {
    var v = viewport();
    var isPortrait = v.height > v.width;

    if (isPortrait && config.rotation === "ll") {
        // landscape left
        element("page").className = "landscape";
        forcedRotation = true;

        element("page").style.transform = "rotate(90deg)";
        element("page").style.transformOrigin = "bottom left";
        element("page").style.webkitTransform = "rotate(90deg)";
        element("page").style.webkitTransformOrigin = "bottom left";
        element("page").style.position = "absolute";
        element("page").style.top = -v.width + "px";

        element("page").style.height = v.width + "px";
        element("page").style.width = v.height + "px";
    } else if (isPortrait && config.rotation === "lr") {
        // landscape right
        element("page").className = "landscape";
        forcedRotation = true;

        element("page").style.transform = "rotate(-90deg)";
        element("page").style.transformOrigin = "bottom right";
        element("page").style.webkitTransform = "rotate(-90deg)";
        element("page").style.webkitTransformOrigin = "top left";
        element("page").style.position = "absolute";
        element("page").style.top = v.height + "px";

        element("page").style.height = v.width + "px";
        element("page").style.width = v.height + "px";
    } else if (config.rotation === "up") {
        // upside down
        element("page").className = isPortrait ? "portrait" : "landscape";
        forcedRotation = false;

        element("page").style.transform = "rotate(180deg)";
        element("page").style.transformOrigin = "50% 50% 0";
        element("page").style.webkitTransform = "rotate(180deg)";
        element("page").style.webkitTransformOrigin = "50% 50% 0";
    } else {
        // reset css:
        element("page").className = isPortrait ? "portrait" : "landscape";
        forcedRotation = false;

        element("page").style.transform = "";
        element("page").style.transformOrigin = "";
        element("page").style.webkitTransform = "";
        element("page").style.webkitTransformOrigin = "";
        element("page").style.position = "";
        element("page").style.top = "";
        element("page").style.background = "";

        element("page").style.height = "";
        element("page").style.width = "";
    }
}

// ============================================================================
// Config Load
// ============================================================================

var configServer = null;
var config = null;

function refreshConfig() {
    getJSON(
        "./config.json",
        function(err, data) { processConfig(data); },
    );
}

function processConfig(data) {
    if (configServer != null) {
        if (JSON.stringify(configServer) != JSON.stringify(data))
            location.reload();
    } else {
        configServer = data;
        config = deepmerge(configServer, getParamsAsObject(location.href));
        load();
    }
}

window.addEventListener('load', function () {
    refreshConfig();
});

// ============================================================================
// Page Load
// ============================================================================

function load() {
    moment.locale(config.api.lang);

    if (getApiParams() === null) window.location = "./config";

    refreshCurrentWeather();
    setInterval(function() { refreshCurrentWeather(); }, config.pollTime.currentWeather);

    refreshForecastWeather();
    setInterval(function() { refreshForecastWeather(); }, config.pollTime.forecastWeather);
    
    refreshDateTime();
    setInterval(function() { refreshDateTime(); }, config.pollTime.dateTime);

    refreshVersion();
    setInterval(function() { refreshVersion(); }, config.pollTime.version);

    // We just loaded the config, so we don't need to refresh right now
    setInterval(function() { refreshConfig(); }, config.pollTime.config);
    
    clearScreenLoop();
    rotate();
    setRem("load");
    setNightMode();
}

window.addEventListener("resize", function() {
    rotate();
    setRem("resize");
});

function setRem(prefix) {
    var v = viewport();
    var root = document.querySelector(":root");
    root.style.fontSize = ((forcedRotation === false ? v.height : v.width) / 100) + "px";
}

// ============================================================================
// Night Mode
// ============================================================================

// For night mode.
var sunsetHour = 18;
var sunriseHour = 6;

function setNightMode() {
    var root = document.querySelector(":root");
    if (isNightMode()) {
        root.className = "night";
    } else {
        root.className = null;
    }
}

function isNightMode() {
    var nightMode = config.nightMode || "off";
    
    if (nightMode === "on") return true;

    if (nightMode === "auto") return isNight(sunsetHour, sunriseHour);

    var found = nightMode && nightMode.match(/([0-9][0-9]?)-([0-9][0-9]?)/);
    if (found) return isNight(found[1], found[2]);

    return false;
}

function isNight(f, t) {
    var from = parseInt(f);
    var to = parseInt(t);

    var now = moment().utcOffset(config.utcOffset).hour();

    if (from > to) {
        return from <= now || to > now;
    } else {
        return from <= now && to > now;
    }
}

// ============================================================================
// Clear Screen
// ============================================================================

function clearScreenLoop() {
    var now = new Date();
    var cleanTime = (new Date()).setHours(4,0,0);
    var diff = cleanTime - now;
    if (diff < 0) diff += 24 * 60 * 60 * 1000;

    setTimeout(
        function() {
            clearScreen()
            clearScreenLoop();
        },
        diff
    );
}

function clearScreen(times) {
    if (typeof(times) == 'undefined') {
        times = 5;
    }

    var elementCleaner = element("cleaner");

    if (times <= 0) {
        elementCleaner.style.display = 'none';
        return;
    }

    elementCleaner.style.display = 'block';
    elementCleaner.style.background = times % 2 == 0 ? "#ffffff" : "#000000";
    window.setTimeout(function () {
        clearScreen(times - 1);
    }, 500);
}