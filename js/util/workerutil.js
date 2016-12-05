// Creates a web worker given a string of JS.
exports.createWorker = function(jsContent) {
    window.URL = window.URL || window.webkitURL;

    var blob;
    try {
        blob = new Blob([jsContent], {type: 'application/javascript'});
    } catch (e) {
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(jsContent);
        blob = blob.getBlob();
    }

    var worker = new Worker(URL.createObjectURL(blob));
    return worker;
}
