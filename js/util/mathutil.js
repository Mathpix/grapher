// returns whether the given expression contains
// the given symbol
exports.exprContainsSymbol = function(expr, sym) {
	var filterList = expr.filter(function(n) {
		return n.isSymbolNode && n.name == sym;
	});
	// has at least 1 match
	return filterList.length > 0;
}
