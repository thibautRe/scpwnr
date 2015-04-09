var ffmetadata = require("ffmetadata");

var options = {
  attachments: ["cover.jpg"],
};

ffmetadata.write("title.mp3", {}, options, function(err) {
    console.log(err)
    if (err) console.error("Error writing cover art");
    else console.log("Cover art added");
});