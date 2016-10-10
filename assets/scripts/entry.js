// dependencies
window.Detector = require('three/examples/js/Detector.js');
window.THREE = require('three');
require('three/examples/js/controls/TrackballControls.js'); // mutates window.THREE
require('three/examples/js/controls/OrbitControls.js'); // mutates window.THREE

window.THREEx = {};
THREEx.WindowResize = require('exports?THREEx.WindowResize!./vendor/THREEx.WindowResize.js');

window.$ = window.jQuery = require('jquery');
require('materialize-css'); // mutates window.$ (jQuery)

window.math = require('mathjs');
require('./vendor/mathquill.min.js'); // mutates window

// code for our actual app
require('babel?presets=react!./ui.js'); // mutates window.Grapher
