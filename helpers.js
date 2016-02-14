"use strict";

const touchEnabled = "ontouchstart" in document.documentElement;
const pressEvent   = touchEnabled ? "touchend" : "click";


/**
 * Wrapper for creating a new DOM element, optionally assigning it a hash of properties upon construction.
 *
 * @param {String} nodeType - Element type to create.
 * @param {Object} obj - An optional hash of properties to assign the newly-created object.
 * @return {Element}
 */
function New(nodeType, obj){
	var i,
	node   = document.createElement(nodeType),
	absorb = function(a, b){
		for(i in b)
			if(Object(a[i]) === a[i] && Object(b[i]) === b[i])
				absorb(a[i], b[i]);
			else a[i] = b[i];
	};
	if(obj) absorb(node, obj);
	return node;
}
