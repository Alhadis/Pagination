(function(){
	"use strict";

	var touchEnabled = "ontouchstart" in document.documentElement;
	var pressEvent   = touchEnabled ? "touchend" : "click";
	var toString     = ({}).toString;
	
	/** Workaround for IE8 being DOM-illiterate */
	var Node = window.Node || window.Element;



	function Pagination(el, options){
		var THIS            = this;
		var options         = options || {};
		var activeClass     = options.activeClass  || "active";
		var links           = [];
		var leftClip;
		var rightClip;
		
		/** Internal values */
		var _length         = 0;
		var _active         = 0;
		var _linkTemplate;
		var _clipTemplate;
		
		
		Object.defineProperties(THIS, {
			
			/** The blueprint used to generate new page links */
			linkTemplate: {
				get: function(){ return _linkTemplate },
				set: function(input){
					
					/** No change? Don't bother */
					if(input === _linkTemplate) return;
					
					_linkTemplate = parseTemplate(input);
				}
			},
			
			
			
			/** The blueprint for generating truncation indicators */
			clipTemplate: {
				get: function(){ return _clipTemplate },
				set: function(input){
					
					/** Sanity check */
					if(input === _clipTemplate) return;
					
					_clipTemplate = parseTemplate(input);
					leftClip      = create(_clipTemplate, "left");
					rightClip     = create(_clipTemplate, "right");
				}
			},
			
			
			
			/** Total number of pages that can be traversed using this instance */
			length: {
				get: function(){ return _length || 0 },
				set: function(input){
					input = +input;
					if(input < 1) input = 1;
					if(input !== _length){
						var i, link;
						
						/** We're extending the current page range */
						if(input > _length)
							for(i = _length; i < input; ++i){
								(link = links[i]) || links.push(link = createLink(i));
								el.appendChild(link);
							}
						
						/** Shrinking the page range */
						else for(i = _length - 1; i >= input; --i){
							link = links[i];
							if(link.parentNode)
								link.parentNode.removeChild(link);
						}
						
						_length = input;
						
						/** The currently active index exceeds the new bounds. Cap it. */
						if(input <= _active)
							THIS.active = input - 1;
						
						/** Otherwise, check clipping range */
						else rebuild();
					}
				}
			},
			
			
			/**
			 * Zero-based index of the currently-selected link.
			 *
			 * Setting this property will trigger the onChange callback (if specified).
			 * Should the callback return an explicit value of `false`, the assignment is
			 * aborted and no change will be made to the instance's .active property.
			 *
			 * @type {Number}
			 */
			active: {
				get: function(){ return _active },
				set: function(input){
					input = +input;
					
					/** Ensure input falls within valid range */
					if(input < 0)             input = 0;
					else if(input >= _length) input = _length - 1;
					
					if(input !== _active){
						
						/** If there's an onChange callback provided, run it. Bail if it returns false. */
						if("function" === typeof THIS.onChange && false === THIS.onChange(input, _active))
							return;
						
						_active = input;
						rebuild();
					}
				}
			}
		});
		
		
		THIS.el             = el;
		THIS.onChange       = options.onChange;
		THIS.linkTemplate   = options.linkTemplate;
		THIS.clipTemplate   = options.clipTemplate || "&hellip;";
		THIS.startRange     = +options.startRange  || 1;
		THIS.endRange       = +options.endRange    || 1;
		THIS.activeRange    = +options.activeRange || 2;
		THIS.length         = options.length       || 20;
		THIS.active         = options.active       || 10;
		
		
		
		/**
		 * Create an element from a template variable. Internal use only.
		 *
		 * @private
		 * @param {Function|Node|String} template
		 * @param {Array} args - Arguments passed to template variable if it's a function
		 * @return {Node}
		 */
		function create(template, args){
			
			/** Short-circuit falsy values */
			if(!template) return;
			
			
			var result = template;
			
			/** Invoke a callback to generate the link element */
			if("function" === typeof template)
				result = template.apply(null, args);
			
			/** The callback returned a string, so use it to construct an HTML element */
			if("[object String]" === toString.call(result))
				result = parseHTML(result);
			
			if(result instanceof Node)
				result = result.cloneNode(true);
			
			return result;
		}
		
		
		/**
		 * Create a link element for an index.
		 *
		 * @param {Number} index - Zero-based page index
		 * @return {HTMLElement}
		 */
		function createLink(index){
			var result = (
				create(_linkTemplate, [index, THIS]) ||
				New("a", { href: "#" })
			).cloneNode(true);
			
			/** Set the link's text, unless an author used a callback (we'll assume they took care of that) */
			if("function" !== typeof _linkTemplate){
				var label = deepest(result);
				if(!label.childNodes.length)
					label.appendChild(document.createTextNode(""));
				label.childNodes[0].data = index + 1;
			}
			
			
			result.addEventListener(pressEvent, function(e){
				THIS.active = index;
				e.preventDefault();
				return false;
			});
			
			result.setAttribute("data-index", index);
			return result;
		}
		
		
		
		/**
		 * Return a blueprint for generating new elements. Internal use only.
		 *
		 * Values may be an HTML string, an element reference, or a function that
		 * returns an element. Functions are called with two parameters: the page
		 * link's index, and a reference to the owning Pagination object.
		 *
		 * The returned array holds two values: the template value, and an integer
		 * representing how it's supposed to be used.
		 *
		 * @private
		 * @param {Function|HTMLElement|String} input
		 * @return {Array}
		 */
		function parseTemplate(input){
			
			/** Short-circuit for falsy values */
			if(!input) return;
			
			
			/** DOM element: the "Object(...)" part resolves an issue with IE8 ("Function expected", wtf) */
			if(Object(input) instanceof Element){
				
				/** Detach element from the DOM if it's attached */
				var parent = input.parentNode;
				parent && parent.removeChild(input);
				
				return input;
			}

			
			/** If it's a string, use it to construct a new HTML element */
			else if("[object String]" === toString.call(input))
				return parseHTML(input);
			
			
			/** Alternatively, accept a function that returns an element */
			else if("function" === typeof input)
				return input;
		}
		
		

		/**
		 * Parse an HTML block and return the first element contained in the result.
		 *
		 * If the fragment holds no elements, the first text node is returned instead.
		 *
		 * @private
		 * @param {String} input
		 * @return {Node}
		 */
		function parseHTML(input){
			var frag = document.createDocumentFragment();
			var root = frag.appendChild(New("div"));
			root.insertAdjacentHTML("afterbegin", input);
			return root.removeChild(root.firstElementChild || root.firstChild);
		}
		
		
		
		/**
		 * Refresh the display of the pagination links with the current settings.
		 */
		function rebuild(){
			if(!links[_active]) return;
			
			/** Drop each link */
			while(el.firstChild)
				el.removeChild(el.firstChild);
			
			
			var start    = THIS.startRange;
			var left     = _active - THIS.activeRange;
			var right    = _active + THIS.activeRange;
			var end      = _length - THIS.endRange;
			var children = [];
			var i, l;
			
			
			/** Reattach leading range */
			for(i = 0; i < start; ++i)
				children.push(el.appendChild(links[i]));
			
			
			/** Should we display a truncation indicator? */
			if(left > start)
				el.appendChild(leftClip);
			
			
			/** Display the active range */
			for(i = Math.max(start, left); i <= Math.min(_length - 1, right); ++i)
				children.push(el.appendChild(links[i]));
			
			
			/** Check if we should display a truncation indicator for the right-side too */
			if(right < end)
				el.appendChild(rightClip);
			
			
			/** Reattach trailing range */
			for(i = end; i < _length; ++i)
				children.push(el.appendChild(links[i]));
			
			/** Run through each node that was added and check their classes list */
			for(i = 0, l = children.length; i < l; ++i){
				var elIndex = +children[i].getAttribute("data-index");
				children[i].classList[elIndex === _active ? "add" : "remove"](activeClass);
			}
		}
	}

	/** If IE8PP exists, it means the author wants/needs IE8 support. See also: tinyurl.com/fixIE8-9 */
	if("function" === typeof window.IE8PP)
		Pagination = IE8PP(Pagination);



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



	/** Export */
	window.Pagination = Pagination;
}());
