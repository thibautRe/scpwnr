var Conversion = function(id) {
    this.id = id;
    this.status = ko.observable();
    this.url = ko.observable();
    this.errorMsg = ko.observable();
    this.isExpanded = ko.observable(true);
    this.tracks = ko.observableArray();
};

Conversion.prototype.expand = function() {
    this.isExpanded(true);
};