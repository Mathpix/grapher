// thicken a flat surface

// thicken modes:
//   * OPPOSITE_NORMAL: thicken in the direction opposite the normal
//   * NORMAL: thicken in the direction opposite the normal
//   * BOTH_WAYS: thicken going in both ways to the normal
//   * Z_DOWN: thicken by offseting z
exports.THICKEN_MODE = {
    OPPOSITE_NORMAL: 0,
    NORMAL: 1,
    BOTH_WAYS: 2,
    Z_DOWN: 3
}

// thickens a surface
//
// arguments:
//   * geometry - the surface (THREE.Geometry)
//   * depth - a number
exports.thickenSurface = function(geometry, depth) {
    var newGeo = geometry.clone();

    var boundaryVerts = findBoundaryVertices(newGeo);

    var vertLen = geometry.vertices.length;
    for (var i = 0; i < vertLen; i++) {
        var n = new THREE.Vector3(0,0,0);
        var count = 0;
        for (var j = 0; j < geometry.faces.length; j++) {
            var f = geometry.faces[j];
            if (f.a == i || f.b == i || f.c == i) {
                n.add(f.normal);
                count++;
            }
        }

        if (count != 0) {
            var p = newGeo.vertices[i].clone().addScaledVector(n, depth / count);
            newGeo.vertices.push(p);
        }
    }

    var faceLen = newGeo.faces.length;
    for (var i = 0; i < faceLen; i++) {
        var f = newGeo.faces[i];
        var a = f.a + vertLen,
            b = f.b + vertLen,
            c = f.c + vertLen;
        newGeo.faces.push(new THREE.Face3(a, b, c, f.normal.clone()));
    }

    for (var i = 0; i < boundaryVerts.length; i += 2) {
        var a1 = boundaryVerts[i],
            b1 = boundaryVerts[i+1],
            a2 = boundaryVerts[i] + vertLen,
            b2 = boundaryVerts[i+1] + vertLen;

        if (depth > 0) {
            var f1 = new THREE.Face3(b1, a2, b2);
            var f2 = new THREE.Face3(b1, a1, a2);
        } else {
            var f1 = new THREE.Face3(b2, a2, b1);
            var f2 = new THREE.Face3(a2, a1, b1);
        }

        newGeo.faces.push(f1);
        newGeo.faces.push(f2);
    }

    newGeo.mergeVertices();
    newGeo.computeFaceNormals();
    newGeo.computeVertexNormals();

    if (depth > 0) {
        for (var i = 0; i < faceLen; i++) {
            var f = newGeo.faces[i];
            f.normal.multiplyScalar(-1);
            // swap two vertices (change normal direction)
            var a = f.a, c = f.c;
            f.a = c;
            f.c = a;
        }
    } else {
        for (var i = 0; i < faceLen; i++) {
            var f = newGeo.faces[i+faceLen];
            f.normal.multiplyScalar(-1);
            // swap two vertices (change normal direction)
            var a = f.a, c = f.c;
            f.a = c;
            f.c = a;
        }
    }

    return newGeo;
}

// does same thickening, but for BufferGeometry
exports.thickenBufferSurface = function(geometry, mode, depth) {
    var newGeo = geometry.clone();

    var positions = newGeo.getAttribute('position');
    var normals = newGeo.getAttribute('normal');
    for (var i = 0; i < positions.count * positions.itemSize; i++) {
        positions.array[i] = positions.array[i] + normals.array[i] * depth;
    }

    return newGeo;
}

// finds the vertices that are on the boundary of a mesh.
// a vertex is on the boundary if it shares an edge that
// only appears in one face.
//
// returns: a 1D array of pairs of vertices that form an
//          edge along the mesh boundary.
function findBoundaryVertices(geometry) {
    var boundary = [];
    var lookup = {};

    // generate lookup table mapping vertex pairs to how
    // many times they appear in faces
    for (var i = 0; i < geometry.faces.length; i++) {
        var f = geometry.faces[i];

        var ab = f.a + '_' + f.b;
        if (lookup[ab]) {
            lookup[ab]++;
        } else {
            var ba = f.b + '_' + f.a;
            if (lookup[ba])
                lookup[ba] += 1;
            else
                lookup[ba] = 1;
        }

        var bc = f.b + '_' + f.c;
        if (lookup[bc]) {
            lookup[bc]++;
        } else {
            var cb = f.c + '_' + f.b;
            if (lookup[cb])
                lookup[cb] += 1;
            else
                lookup[cb] = 1;
        }

        var ca = f.c + '_' + f.a;
        if (lookup[ca]) {
            lookup[ca]++;
        } else {
            var ac = f.a + '_' + f.c;
            if (lookup[ac])
                lookup[ac] += 1;
            else
                lookup[ac] = 1;
        }
    }

    var boundaryVertPairs = [];

    for (k in lookup) {
        if (lookup[k] != 1) continue;

        var idx = k.indexOf('_');
        var vert1 = parseInt(k);
        var vert2 = parseInt(k.substring(idx+1));
        boundaryVertPairs.push(vert1);
        boundaryVertPairs.push(vert2);
    }

    return boundaryVertPairs;
}
