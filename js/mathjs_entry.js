var core = require('mathjs/core');
var math = core.create();

math.pi  = Math.PI;
math.tau = Math.PI * 2;
math.e   = Math.E;
math.phi = 1.61803398874989484820458683436563811772030917980576286213545; // golden ratio, (1+sqrt(5))/2

math.import(require('mathjs/lib/function'));
math.import(require('mathjs/lib/expression/function/compile'));
