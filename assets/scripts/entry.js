// dependencies
window.Detector = require('three/examples/js/Detector.js');
window.THREE = require('three');
require('three/examples/js/controls/TrackballControls.js'); // mutates window.THREE
require('three/examples/js/controls/OrbitControls.js'); // mutates window.THREE

window.THREEx = {};
require('imports?THREEx=>window.THREEx!./vendor/THREEx.KeyboardState.js'); // mutates window.THREEx
require('imports?THREEx=>window.THREEx!./vendor/THREEx.WindowResize.js'); // mutates window.THREEx
require('imports?THREEx=>window.THREEx!./vendor/THREEx.FullScreen.js'); // mutates window.THREEx

window.math = require('mathjs');

// code for our actual app
window.Grapher = {};
require('babel?presets=react!./ui.js'); // mutates window.Grapher
