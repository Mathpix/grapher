var Grapher = require('./3d.js');
var math = require('mathjs');
var CustomArrow = require('./CustomArrow.js');
var createIsoSurface = require('./mc.js').createIsoSurface;
var workerUtil = require('./workerutil.js');

var workerContent = require('raw-loader!./3dworker.js');
var worker1 = workerUtil.createWorker(workerContent);
var worker2 = workerUtil.createWorker(workerContent);
var worker3 = workerUtil.createWorker(workerContent);
var worker4 = workerUtil.createWorker(workerContent);

var handleMessage = function(m) {
    var data = m.data;
    if (data.action == 'iso_done') {
        $('.progress-bar').css('width', '100%');
        setTimeout(function() {
            $('#progress-info-container').css('opacity', '0');
        }, 350);

        var vertexIndices = data.res.vertexIndices;
        var vertexPositions = data.res.vertexPositions;

        var indices = new Uint32Array(vertexIndices);
        var positions = new Float32Array(vertexPositions);

        var geo = new THREE.BufferGeometry();
        geo.setIndex(new THREE.BufferAttribute(indices, 1));
        geo.addAttribute('position', new THREE.BufferAttribute(positions, 3));

        geo.computeVertexNormals();

        var mat = new THREE.MeshNormalMaterial({
            side: THREE.DoubleSide
        });

        var mesh = new THREE.Mesh(geo, mat);

        Grapher._3D.Main.surfaces.add(mesh);

        Grapher._3D.Main.surfaces.children.forEach(function(s) {
            if (s.name == data.id)
                s.add(mesh);
        });
    } else if (data.action == 'progress') {
        // only use progress data from worker #1 to avoid
        // erratic changes
        if (data.workerId == 1) {
            var width = Math.round(data.progress * 100) + '%';
            $('.progress-bar').css('width', width);
        }
    } else if (data.error && data.workerId == 1) {
        console.log("ERROR");
        $('#progress-info-container').css('opacity', '0');
    }
}

worker1.onmessage = handleMessage;
worker2.onmessage = handleMessage;
worker3.onmessage = handleMessage;
worker4.onmessage = handleMessage;


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
    latex = latex.replace(/\\cdot/g, "*");
    latex = latex.replace(/\\operatorname\{abs\}/g, "abs");
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
        var res = dograph(latex, text, eqId);
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

function dograph(latex, text, id) {
    var obj;
    var type;

    var vecComponents = extractVectorComponents(latex);
    var pointComponents = extractPointComponents(text);
    var parametricComponents = extractParametricComponents(latex);

    var paramMode = undefined;
    if (parametricComponents) {
        var arr = parametricComponents;
        if (arr[0] == 'x' && arr[1] == 'y' && arr[2] == 'z') {
            paramMode = 'rectangular';
        } else if (arr[0] == 'r' && arr[1] == '\\theta' && arr[2] == 'z') {
            paramMode = 'cylindrical';
        }
    }
    console.log("parametric mode", paramMode);
    var vfComponents = extractVFComponents(latex);
        if (parametricComponents && paramMode !== undefined) {
        var xComp = math.compile(parametricComponents[3]);
        var yComp = math.compile(parametricComponents[4]);
        var zComp = math.compile(parametricComponents[5]);

        var zc = Grapher.Options.zoomCoeff;
        var Parametric = THREE.Curve.create(
            function() {},
            function(t) {
                var x = xComp.eval({t: t/zc});
                var y = yComp.eval({t: t/zc});
                var z = zComp.eval({t: t/zc});
                if (paramMode == 'cylindrical') {
                    var xNew = x * Math.cos(y);
                    var yNew = x * Math.sin(y);
                    x = xNew;
                    y = yNew;
                }
                return new THREE.Vector3(x/zc, y/zc, z/zc);
            }
        );

        var curve = new Parametric();
        var geo = new THREE.TubeGeometry(curve, 300, 0.04, 9, false);
        var mesh = new THREE.Mesh(geo, new THREE.MeshNormalMaterial({side: THREE.DoubleSide}));

        obj = mesh;
        type = 'parametric';
    } else if (vfComponents) {
        obj = new THREE.Object3D();
        var xComp = math.compile(vfComponents[0]);
        var yComp = math.compile(vfComponents[1]);
        var zComp = math.compile(vfComponents[2]);

        var zc = Grapher.Options.zoomCoeff;
        for (var x = -3; x <= 3; x += 1) {
            for (var y = -3; y <= 3; y += 1) {
                for (var z = -3; z <= 3; z += 1) {
                    var ctx = {x:zc*x, y:zc*y, z:zc*z};
                    var vecX = xComp.eval(ctx);
                    var vecY = yComp.eval(ctx);
                    var vecZ = zComp.eval(ctx);

                    var vec = new THREE.Vector3(vecX, vecY, vecZ);
                    var len = vec.length();
                    if (len == 0) continue;
                    vec.normalize();
                    var color = new THREE.Color().setHSL(Math.abs(len-5)/10.0, 1, 0.5);
                    var arrow = new CustomArrow(
                        vec, new THREE.Vector3(x,y,z), 1,
                        color, undefined, 0.25, 5
                    );
                    obj.add(arrow);
                }
            }
        }

        type = 'vectorfield';
    } else if (vecComponents) {
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
        var parts = eq.split("=");
        if (parts.length != 2) return;

        var eq = parts[0] + "-(" + parts[1] + ")";

        var msg = {
            id: id,
            action: 'iso_create',
            eq: eq,
            zmin: -3,
            zmax: 3,
            step: 0.1,
            zc: Grapher.Options.zoomCoeff
        }
        msg.xmin = -3;
        msg.xmax = 0;
        msg.ymin = -3;
        msg.ymax = 0;
        // -3, 0 and -3, 0
        msg.workerId = 1;
        worker1.postMessage(msg);
        msg.ymin = 0;
        msg.ymax = 3;
        // -3, 0 and 0, 3
        msg.workerId = 2;
        worker2.postMessage(msg);
        msg.xmin = 0;
        msg.xmax = 3;
        // 0, 3 and 0, 3
        msg.workerId = 3;
        worker3.postMessage(msg);
        msg.ymin = -3;
        msg.ymax = 0;
        // 0, 3 and -3, 0
        msg.workerId = 4;
        worker4.postMessage(msg);

        $('.progress-bar').remove();
        $('#progress-info-container').append('<div class="progress-bar"></div>');
        $('#progress-info-container').css('opacity', '1');

        obj = new THREE.Object3D();
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

function extractParametricComponents(latex) {
    latex = processLatex(latex)
    var regex = /^\\begin{bmatrix}(.*?)\\\\(.*?)\\\\(.*?)\\end{bmatrix}=\\begin{bmatrix}(.*?)\\\\(.*?)\\\\(.*?)\\end{bmatrix}$/;
    var matches = regex.exec(latex);
    if (matches == null) {
        return null;
    } else {
        return matches.slice(1);
    }
}

function extractVFComponents(latex) {
    latex = processLatex(latex);
    var regex = /^\\Delta\\begin{bmatrix}x\\\\y\\\\z\\end{bmatrix}=\\begin{bmatrix}(.*?)\\\\(.*?)\\\\(.*?)\\end{bmatrix}$/;
    var matches = regex.exec(latex);
    if (matches == null) {
        return null;
    } else {
        return matches.slice(1);
    }
}
