var params = {};
window.location.search.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function(str, key, value) {
        params[key] = decodeURIComponent(value);
    }
);

var paramKeys = [
    "city",
    "lat",
    "lon",
    "lang",
    "rotation",
    "units",
    "night",
    "appId",
    "utcOffset",
];

for (var i = 0; i < paramKeys.length; i++) {
    var key = paramKeys[i];
    if (params[key])
        document.getElementById(key).value = params[key];
}