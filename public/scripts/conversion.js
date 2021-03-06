var Conversion = function(id) {
    this.id = id;
    this.status = ko.observable();
    this.url = ko.observable();
    this.errorMsg = ko.observable();
    this.isExpanded = ko.observable(true);
    this.tracks = ko.observableArray();

    this.isFinished = ko.computed(this.isFinished, this);
};

Conversion.prototype.expand = function() {
    this.isExpanded(true);
};

Conversion.prototype.isFinished = function() {
    var tracks = this.tracks();

    if (tracks.length == 0) return false;
    
    for (var i in tracks) {
        if (tracks[i].downloadStatus() != 'downloaded') {
            return false;
        }
    }
    return true;
};

Conversion.prototype.findTrackByName = function(name) {
    var tracks = this.tracks();
    for (var i in tracks) {
        if (tracks[i].getName() == name) {
            return tracks[i];
        }
    }
};