// string processing for math

// Does processing for latex strings so mathjs
// can handle them better.
//
// returns: processed string
exports.processLatex = function(latex) {
    // matrices
    latex = latex.replace(/\\begin{[bp]matrix}(.*?)\\end{[bp]matrix}/g, function(_, m) {
        return "([" + m.replace(/\&/g, ",").replace(/\\\\/g, ";") + "])";
    });

    latex = latex.replace(/\\left/g, "");
    latex = latex.replace(/\\right/g, "");
    latex = latex.replace(/\\sin/g, "sin");
    latex = latex.replace(/\\cos/g, "cos");
    latex = latex.replace(/\\tan/g, "tan");
    latex = latex.replace(/\\log/g, "log");
    latex = latex.replace(/\\ln/g, "log");
    latex = latex.replace(/\\pi/g, "pi ");
    latex = latex.replace(/\\Gamma/g, "gamma");
    latex = latex.replace(/\\cdot/g, "*");
    latex = latex.replace(/\\operatorname\{abs\}/g, "abs");
    latex = latex.replace(/\^{(.*?)}/g, "^($1)");
    return latex;
}

// Does processing for strings returned by a MathField's
// .text() function so mathjs can handle them better.
//
// returns: processed string
exports.processText = function(text) {
    text = text.replace(/f\*\(x\*,\*y\)/g, "z");
    text = text.replace(/f\*\(y\*,\*x\)/g, "z");
    text = text.replace(/f\*\(y\*,\*z\)/g, "x");
    text = text.replace(/f\*\(z\*,\*y\)/g, "x");
    text = text.replace(/f\*\(x\*,\*z\)/g, "y");
    text = text.replace(/f\*\(z\*,\*x\)/g, "y");

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

    text = text.replace(/\\g\*a\*m\*m\*a \*/g, "gamma");

    text = text.replace(/\\operatorname\{(.*?)\}\*/g, function(_, m) {
        return m.replace(/\*/g, "");
    });

    text = text.replace(/([a-zA-Z])\*,/g, "$1,");

    return text;
}

// TODO: fix this so it works with multiple vectors!
// Checks if the equation is a single column vector with 3
// components
//
// returns:
//   - 3 vector components as an array of strings
//   - null if no vector was found
exports.extractVector = function(latex) {
    latex = processLatex(latex);
    var regex = /^\\begin{bmatrix}(.*?)\\\\(.*?)\\\\(.*?)\\end{bmatrix}$/;
    var matches = regex.exec(latex);
    if (matches == null) {
        return null;
    } else {
        return matches.slice(1);
    }
}

exports.extractPointComponents = function(text) {
    text = processText(text);
    var regex = /^\((.*?)\s*,\s*(.*?)\s*,\s*(.*?)\)$/;
    var matches = regex.exec(text);
    if (matches == null) {
        return null
    } else {
        return matches.slice(1);
    }
}
