window.Grapher = {};

window.math = require('mathjs');
require('babel?presets=react!./ui.js'); // mutates window.Grapher

window.Detector = require('three/examples/js/Detector.js');
window.THREE = require('three');
require('three/examples/js/controls/TrackballControls.js'); // mutates window.THREE
require('three/examples/js/controls/OrbitControls.js'); // mutates window.THREE
