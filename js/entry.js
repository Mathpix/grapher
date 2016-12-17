// dependencies
window.THREE = require('three');
require('three/examples/js/controls/OrbitControls.js'); // mutates window.THREE

window.$ = window.jQuery = require('jquery');
require('materialize-css'); // mutates window.$ (jQuery)
require('./vendor/mathquill.min.js'); // mutates window; must come after jQuery

// code for our actual app
require('babel?presets=react!./ui.js'); // mutates window.Grapher

window.setReplaceLatex = function(){};
