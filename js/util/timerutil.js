// A class for "confirmed callbacks", meaning a callback that's
// only called after a certain amount of time has passed since
// the last occurance of another callback being called.
// E.g. this could be used to fire a callback after it's been
// a second since a text field has been edited.
exports.ConfirmedCallback = function(durationMs, confirmedCb) {
	this.durationMs = durationMs;
	this.confirmedCb = confirmedCb;

	this.currentTimeout = undefined;

	this.callback = (function() {
		if (this.currentTimeout) {
			clearTimeout(this.currentTimeout);
		}

		this.currentTimeout = setTimeout(this.confirmedCb, this.durationMs);
	}).bind(this);
}
