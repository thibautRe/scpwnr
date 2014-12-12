// Return the type of the url
var getUrlType = function(url) {
    // If it is a userlist
    //  https://soundcloud.com/thenoisyfreaks
    //  https://soundcloud.com/thenoisyfreaks/
    if (!/soundcloud\.com\/.*\/[\S]/.test(url)) {
        return 'user';
    }

    // If it is a set
    // https://soundcloud.com/thenoisyfreaks/sets/straight-life-album
    else if (/\/sets\//.test(url) && !/(\?in=).*\/sets\//.test(url)) {
        return 'set';
    }

    // Else, it is a track
    return 'track';
}

// NodeJS related
if (module && module.exports) {
    module.exports = {
        'getUrlType': getUrlType
    };
}