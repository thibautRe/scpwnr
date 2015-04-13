var io = io.connect();
var conversions = ko.observableArray([]);
var trackUrl = ko.observable('');
var showErrorTooltip = ko.observable(false);
var currentPage = ko.observable('scpwnr');
var sessionDownloads = ko.observable(0);
var showErrorTooltipTimeout;

var findConversionById = function(id) {
    var _conversions = conversions();
    for (var i in _conversions) {
        if (_conversions[i].id == id) {
            return _conversions[i];
        }
    }
};

// Listen for the talk event.
io.on('conversion-begin', function(data) {
    var newConversion = new Conversion(data.id);
    conversions.unshift(newConversion);
    newConversion.status('pending');
    newConversion.url(data.url);
});
io.on('conversion-finish', function(data) {
    var conversion = findConversionById(data.id);
    conversion.status('finish');

    // Make Track objects
    var bufferTracks = [];
    for (var i in data.tracks) {
        var newTrack = new Track(data.tracks[i]);
        bufferTracks.push(newTrack);
    }
    conversion.tracks(bufferTracks);
});
io.on('conversion-error', function(data) {
    var conversion = findConversionById(data.id);
    conversion.status('error');
    conversion.errorMsg(data.consoleMsg.stdout);
});
io.on('down-progress', function(data) {
    var conversion = findConversionById(data.id);
    var track = conversion.findTrackByName(data.name);
    track.downloadProgress(data.progress);
});
io.on('down-error', function(data) {
    var conversion = findConversionById(data.id);
    console.log(data.id, data.name, conversion.tracks());
    var track = conversion.findTrackByName(data.name);
    track.downloadStatus('error');
})
io.on('down-finish', function(data) {
    var conversion = findConversionById(data.id);
    var track = conversion.findTrackByName(data.name);
    track.downloadStatus('downloaded');
});
io.on('downloadnumber-changed', function(data) {
    sessionDownloads(data.sessionDownloads);
});

var requestForm = $('.js-form--main');

// on submit
requestForm.submit(function() {
    var url = getCleanedUrl(trackUrl());
    trackUrl('');

    if (url === undefined) {
        showErrorTooltip(true);
        if (showErrorTooltipTimeout != undefined) {
            clearTimeout(showErrorTooltipTimeout);
        }
        showErrorTooltipTimeout = setTimeout(function() {
            showErrorTooltip(false);
            showErrorTooltipTimeout = undefined;
        }, 4000);
        return false;
    }

    // Disable the form
    $('js-form--main input').attr('disabled', 'true');

    io.emit('/api/conversion-request', {
        url: url,
        type: getUrlType(url)
    });

    return false;
});

ko.applyBindings({
    conversions: conversions,
    trackUrl: trackUrl,
    deleteConversion: function(conversion) {
        conversions.remove(conversion);
    },
    showErrorTooltip: showErrorTooltip,
    currentPage: currentPage,
    changePage: function() {
        if (currentPage() == 'scpwnr') currentPage('infos');
        else currentPage('scpwnr');
    }
});

var formMain = $('.js-form--main');

var formMainTop = formMain.offset().top;
$('.js-form--main-stickyrepl').height(formMain.height());
// Sticky form
$(window).scroll(function() {
    if ($(window).scrollTop() > formMainTop) {
        formMain.addClass('form--main--sticky');
    }
    else {
        formMain.removeClass('form--main--sticky');
    }
});


// Get the stats
$.getJSON('/api/stats', function(data) {
    sessionDownloads(data.sessionDownloads);
});