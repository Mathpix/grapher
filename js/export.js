var Thicken = require('./util/thicken.js');
require('./util/STLExporter.js')
require('./util/STLBinaryExporter.js')
require('./util/OBJExporter.js')

exports.exportSurface = function(direction, depth, filetype, filename) {
    var mode;
    if (direction === 'opposite') {
        mode = Thicken.THICKEN_MODE.OPPOSITE_NORMAL;
    } else if (direction === 'toward') {
        mode = Thicken.THICKEN_MODE.NORMAL;
    } else {
        return {
            error: 'Invalid extrude direction'
        };
    }

    var depthNum = Number(depth);
    if (isNaN(depthNum)) {
        return {
            error: 'Invalid depth'
        };
    } else if (depthNum <= 0) {
        return {
            error: 'Depth must be positive'
        }
    }

    if (filename.length < 1) {
        return {
            error: 'File name cannot be blank'
        }
    }

    try {
        return doExport(mode, depthNum, filetype, filename);
    } catch (e) {
        console.log("EXPORT ERR", e);
        return {
            error: 'Unexpected error'
        }
    }
}

// converts BufferGeometry to Geometry, if necessary
function optionalGeometryConvert(geo) {
    if (geo instanceof THREE.BufferGeometry) {
        return new THREE.Geometry().fromBufferGeometry(geo);
    } else {
        return geo;
    }
}

function doExport(mode, depth, filetype, filename) {
    if (mode === Thicken.THICKEN_MODE.OPPOSITE_NORMAL) {
        depth *= -1;
    }

    var surfaces = Grapher._3D.Main.surfaces;
    if (surfaces.children.length < 1) {
        return {
            error: 'No surfaces to export'
        }
    }

    var obj = surfaces.children[0];
    var geometry;
    if (obj instanceof THREE.Mesh) {
        geometry = optionalGeometryConvert(obj.geometry);
    } else if (obj instanceof THREE.Object3D) {
        geometry = new THREE.Geometry();

        for (var i = 0; i < obj.children.length; i++) {
            if (obj.children[i].geometry) {
                var childGeo = optionalGeometryConvert(obj.children[i].geometry);
                geometry.merge(childGeo);
            }
        }
    }

    geometry.mergeVertices();
    geometry.computeFaceNormals();

    var thick = Thicken.thickenSurface(geometry, depth);

    var data = convertGeometryToData(thick, filetype);

    var ext;
    if (filetype === 'stl_ascii') {
        ext = '.stl';
    } else if (filetype === 'stl_binary') {
        ext = '.stl';
    } else if (filetype === 'obj') {
        ext = '.obj';
    }

    saveData(data, filename + ext);

    return {
        success: true
    };
}

function convertGeometryToData(geometry, filetype) {
    var mat = new THREE.MeshStandardMaterial({color: 0xFFFFFF});
    var mesh = new THREE.Mesh(geometry, mat);

    var exporter;
    if (filetype === 'stl_ascii') {
        exporter = new THREE.STLExporter();
    } else if (filetype === 'stl_binary') {
        exporter = new THREE.STLBinaryExporter();
    } else if (filetype === 'obj') {
        exporter = new THREE.OBJExporter();
    }

    var dataString = exporter.parse(mesh);

    return dataString;
}

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
            var blob = new Blob([data], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
