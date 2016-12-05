// based on https://threejs.org/docs/api/extras/helpers/ArrowHelper.html

var lineGeometry = new THREE.BufferGeometry();
lineGeometry.addAttribute( 'position', new THREE.Float32Attribute([0, 0, 0, 0, 1, 0], 3));

var coneGeometry = new THREE.CylinderBufferGeometry(0, 0.5, 1, 20, 1);
coneGeometry.translate(0, -0.5, 0);

function ArrowHelper(dir, origin, length, color, headLength, headWidth, linewidth, materialCls) {
	// dir is assumed to be normalized

	THREE.Object3D.call(this);

	if (color === undefined) color = 0xffff00;
	if (length === undefined) length = 1;
	if (headLength === undefined) headLength = 0.2 * length;
	if (headWidth === undefined) headWidth = 0.2 * headLength;
	if (linewidth === undefined) linewidth = 1;
	if (materialCls === undefined) materialCls = THREE.MeshBasicMaterial;

	this.position.copy(origin);

	this.line = new THREE.Line(
		lineGeometry,
		new THREE.LineBasicMaterial({
			color: color, linewidth: linewidth
		})
	);
	this.line.matrixAutoUpdate = false;
	this.add(this.line);

	this.cone = new THREE.Mesh(coneGeometry, new materialCls({color: color, shading: THREE.SmoothShading}));
	this.cone.matrixAutoUpdate = false;
	this.add(this.cone);

	this.setDirection(dir);
	this.setLength(length, headLength, headWidth);
}

ArrowHelper.prototype = Object.create(THREE.Object3D.prototype);
ArrowHelper.prototype.constructor = ArrowHelper;

ArrowHelper.prototype.setDirection = (function() {
	var axis = new THREE.Vector3();
	var radians;

	return function setDirection(dir) {

		// dir is assumed to be normalized

		if (dir.y > 0.99999) {
			this.quaternion.set(0, 0, 0, 1);
		} else if (dir.y < - 0.99999) {
			this.quaternion.set(1, 0, 0, 0);
		} else {
			axis.set(dir.z, 0, -dir.x).normalize();
			radians = Math.acos(dir.y);
			this.quaternion.setFromAxisAngle(axis, radians);
		}

	};

}());

ArrowHelper.prototype.setLength = function (length, headLength, headWidth) {
	if (headLength === undefined) headLength = 0.2 * length;
	if (headWidth === undefined) headWidth = 0.2 * headLength;

	this.line.scale.set(1, Math.max(0, length - headLength), 1);
	this.line.updateMatrix();

	this.cone.scale.set(headWidth, headLength, headWidth);
	this.cone.position.y = length;
	this.cone.updateMatrix();
};

ArrowHelper.prototype.setColor = function(color) {
	this.line.material.color.copy(color);
	this.cone.material.color.copy(color);
};

module.exports = ArrowHelper;
