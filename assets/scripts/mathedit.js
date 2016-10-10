var Grapher = require('./3d.js');
var math = require('mathjs');
var createIsoSurface = require('./mc.js').createIsoSurface;

function processLatex(latex) {
    latex = latex.replace(/\\left/g, "");
    latex = latex.replace(/\\right/g, "");
    latex = latex.replace(/\\sin/g, "sin");
    latex = latex.replace(/\\cos/g, "cos");
    latex = latex.replace(/\\tan/g, "tan");
    latex = latex.replace(/\\log/g, "log");
    latex = latex.replace(/\\ln/g, "ln");

    return latex;
}

var MQ = MathQuill.getInterface(2);

var mathFieldEle = document.querySelector(".eq-input");
var mathField = MQ.MathField(mathFieldEle, {
    spaceBehavesLikeTab: true,
    charsThatBreakOutOfSupSub: '+-=<>',
    handlers: {
        edit: function() {}
    }
})

exports.dograph = function(latexArr) {
    var meshes = [];
    latexArr.forEach(function(latex) {
        var vecComponents = extractVectorComponents(latex);
        var pointComponents = extractPointComponents(latex);
        if (vecComponents) {
            var v1 = math.eval(vecComponents[0]),
                v2 = math.eval(vecComponents[1]),
                v3 = math.eval(vecComponents[2]);

            var vec = new THREE.Vector3(v1, v2, v3);
            var norm = vec.length();
            vec.normalize();
            var arrow = new THREE.ArrowHelper(
                vec, new THREE.Vector3(0, 0, 0), norm,
                Math.random()*0xFFFFFF, undefined, norm/10.0
            );
            meshes.push(arrow);
        } else if (pointComponents) {
            var v1 = math.eval(pointComponents[0]),
                v2 = math.eval(pointComponents[1]),
                v3 = math.eval(pointComponents[2]);

            var geo = new THREE.SphereGeometry(0.1, 20, 20);
            var mat = new THREE.MeshBasicMaterial({color: 0x0000FF});
            var dot = new THREE.Mesh(geo, mat);
            dot.position.set(v1, v2, v3);
            meshes.push(dot);
        } else {
            var eq = processLatex(latex);
            var parts = eq.split("=");
            if (parts.length != 2) return;

            var eq = parts[0] + "-(" + parts[1] + ")";
            var expr = math.compile(eq);

            var f = function(x, y, z) {
                return expr.eval({
                    x: x,
                    y: y,
                    z: z
                });
            }

            console.log("Starting isosurface creation");
            var geo = createIsoSurface(f, 0, -3, 3, -3, 3, -3, 3, 0.1);
            console.log("Finished isosurface creation");
            var mat = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
            var mesh = new THREE.Mesh(geo, mat);
            meshes.push(mesh);
        }
    });

    Grapher._3D.Main.clearSurfaces();
    meshes.forEach(function(mesh) {
        Grapher._3D.Main.addSurface(mesh);
    })
}

function extractVectorComponents(latex) {
    latex = processLatex(latex);
    var regex = /^\\begin{bmatrix}(.*?)\\\\(.*?)\\\\(.*?)\\end{bmatrix}$/;
    var matches = regex.exec(latex);
    if (matches == null) {
        return null;
    } else {
        return matches.slice(1);
    }
}

function extractPointComponents(latex) {
    latex = processLatex(latex);
    var regex = /^\((.*?)\s*,\s*(.*?)\s*,\s*(.*?)\)$/;
    var matches = regex.exec(latex);
    if (matches == null) {
        return null
    } else {
        return matches.slice(1);
    }
}
