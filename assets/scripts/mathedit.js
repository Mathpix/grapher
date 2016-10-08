Grapher._3D = Grapher._3D || {};

function processLatex(latex) {
    latex = latex.replace(/\\left/g, "");
    latex = latex.replace(/\\right/g, "");
    latex = latex.replace(/\\sin/g, "sin");
    latex = latex.replace(/\\cos/g, "cos");
    latex = latex.replace(/\\tan/g, "tan");
    latex = latex.replace(/\\log/g, "log");
    latex = latex.replace(/\\ln/g, "log");
    latex = latex.replace(/\\pi/g, "pi ");
    latex = latex.replace(/\^{(.*?)}/g, "^($1)");

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

Grapher._3D.editGraph = function(latex, eqId) {
    Grapher._3D.removeGraph(eqId);

    try {
        var res = dograph(latex);
        var obj = res.obj;
        obj = res.obj;
        obj.name = eqId;
        Grapher._3D.Main.surfaces.add(obj);

        return {ok: true, type: res.type};
    } catch (err) {
        console.log(err);
        return {error: "I can't graph this"};
    }
}

Grapher._3D.removeGraph = function(eqId) {
    Grapher._3D.Main.surfaces.children.forEach(function(s) {
        if (s.name == eqId)
            Grapher._3D.Main.surfaces.remove(s);
    });
}

function dograph(latex) {
    var obj;
    var type;

    var vecComponents = extractVectorComponents(latex);
    var pointComponents = extractPointComponents(latex);
    if (vecComponents) {
        var v1 = math.eval(vecComponents[0]),
            v2 = math.eval(vecComponents[1]),
            v3 = math.eval(vecComponents[2]);

        var vec = new THREE.Vector3(v1, v2, v3);
        var norm = vec.length();
        vec.normalize();
        var color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        var arrow = new THREE.ArrowHelper(
            vec, new THREE.Vector3(0, 0, 0), norm,
            color, undefined, 0.25, norm / 15.0
        );

        obj = arrow;
        type = 'vector';
    } else if (pointComponents) {
        var v1 = math.eval(pointComponents[0]),
            v2 = math.eval(pointComponents[1]),
            v3 = math.eval(pointComponents[2]);

        var geo = new THREE.SphereGeometry(0.1, 20, 20);
        var mat = new THREE.MeshBasicMaterial({color: 0x0000FF});
        var dot = new THREE.Mesh(geo, mat);
        dot.position.set(v1, v2, v3);

        obj = dot;
        type = 'point';
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

        obj = mesh;
        type = 'surface';
    }

    return {obj: obj, type: type};
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
