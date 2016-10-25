var Grapher = require('./3d.js');
var math = require('mathjs');
var CustomArrow = require('./CustomArrow.js');
var createIsoSurface = require('./mc.js').createIsoSurface;

Grapher.EquationEntries = {};
Grapher.Options = {
    // This coefficient changes the mapping from
    // world coordinates to coordinates used for graphing
    // i.e. x_graph = zoomCoeff * x_world
    zoomCoeff: 1,
    // Resolution in xyz directions. Specifies
    // the step size used when creating a surface.
    xRes: 0.1,
    yRes: 0.1,
    zRes: 0.1
};

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

function processText(text) {
    text = text.replace(/\\s\*i\*n \*/g, "sin");
    text = text.replace(/\\c\*o\*s \*/g, "cos");
    text = text.replace(/\\t\*a\*n \*/g, "tan");

    text = text.replace(/\\s\*e\*c \*/g, "sec");
    text = text.replace(/\\c\*s\*c \*/g, "csc");
    text = text.replace(/\\c\*o\*t \*/g, "cot");

    text = text.replace(/\\m\*a\*x \*/g, "max");
    text = text.replace(/\\m\*i\*n \*/g, "min");

    text = text.replace(/\\a\*b\*s \*/g, "abs");

    text = text.replace(/\\e\*x\*p \*/g, "exp");

    text = text.replace(/\\l\*n \*/g, "ln");
    text = text.replace(/\\l\*o\*g \*/g, "log");

    text = text.replace(/\\operatorname\{(.*?)\}\*/g, function(_, m) {
        return m.replace(/\*/g, "");
    });

    text = text.replace(/([a-zA-Z])\*,/g, "$1,");

    return text;
}

function getVariables(eqStr) {
    var expr = math.parse(eqStr);

    var variables = [];

    expr.traverse(function(node) {
        if (node.type == 'SymbolNode') {
            variables.push(node.name);
        }
    });

    return variables;
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

Grapher._3D.editGraph = function(latex, text, eqId) {
    Grapher._3D.removeGraph(eqId);
    Grapher.EquationEntries[eqId] = {
        latex: latex,
        text: text
    };

    try {
        var res = dograph(latex, text);
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
    delete Grapher.EquationEntries[eqId];
    Grapher._3D.Main.surfaces.children.forEach(function(s) {
        if (s.name == eqId)
            Grapher._3D.Main.surfaces.remove(s);
    });
}

Grapher._3D.refreshAll = function() {
    for (id in Grapher.EquationEntries) {
        var latex = Grapher.EquationEntries[id].latex;
        var text = Grapher.EquationEntries[id].text;
        Grapher._3D.editGraph(latex, text, id);
    }
}

function dograph(latex, text) {
    var obj;
    var type;

    var vecComponents = extractVectorComponents(latex);
    var pointComponents = extractPointComponents(text);
    if (vecComponents) {
        var v1 = math.eval(vecComponents[0]),
            v2 = math.eval(vecComponents[1]),
            v3 = math.eval(vecComponents[2]);

        var vec = new THREE.Vector3(v1, v2, v3).divideScalar(Grapher.Options.zoomCoeff);

        var norm = vec.length();
        vec.normalize();
        var color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        var arrow = new CustomArrow(
            vec, new THREE.Vector3(0, 0, 0), norm,
            color, undefined, 0.25, 5.0
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
        dot.position.divideScalar(Grapher.Options.zoomCoeff);

        obj = dot;
        type = 'point';
    } else {
        var eq = processText(text);
        console.log(eq);
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

        var d = new Date();
        console.log("Starting isosurface creation");
        var zc = Grapher.Options.zoomCoeff;
        var geo = createIsoSurface(
            f, 0,
            -3, 3, -3, 3, -3, 3,
            0.1, zc
        );
        console.log("Finished isosurface creation", new Date() - d);
        var mat = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
        var mesh = new THREE.Mesh(geo, mat);

        obj = mesh;
        type = 'surface';
    }

    return {obj: obj, type: type};
}
exports.dograph = dograph;

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

function extractPointComponents(text) {
    text = processText(text);
    var regex = /^\((.*?)\s*,\s*(.*?)\s*,\s*(.*?)\)$/;
    var matches = regex.exec(text);
    if (matches == null) {
        return null
    } else {
        return matches.slice(1);
    }
}

function extractParametricComponents() {}
