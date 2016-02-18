"use strict";

const undef        = undefined;
const touchEnabled = "ontouchstart" in document.documentElement;
const pressEvent   = touchEnabled ? "touchend" : "click";
const toString     = ({}).toString;


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



/**
 * Return the deepest node within an element's descendants.
 *
 * @param {HTMLElement} el
 * @return {Node}
 */
function deepest(el){
	var children = el.querySelectorAll("*");
	var branches = [];
	var length   = children.length, i;
	
	/** Return the original element if there were no children */
	if(!length) return el;
	
	for(i = 0; i < length; ++i){
		var child  = children[i];
		var depth  = 0;
		var parent = child.parentNode;
		
		while(parent !== el){
			++depth;
			parent = parent.parentNode;
		}
		
		branches.push([depth, child]);
	}
	
	/** Ascertain which child had the greatest depth */
	depth = [-1, null];
	for(i = 0, length = branches.length; i < length; ++i){
		child = branches[i];
		if(child[0] > depth[0])
			depth = child;
	}
	
	return depth[1];
}
