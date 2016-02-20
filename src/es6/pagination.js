"use strict";

class Pagination{
	
	constructor(el, options = {}){
		this._length        = 0;
		this.links          = [];
		this.el             = el;
		
		/** Parse options and their default values */
		let startLength     = options.startLength;
		let endLength       = options.endLength;
		let activeLength    = options.activeLength;
		let length          = options.length;
		let active          = options.active;
		
		this.onChange       = options.onChange;
		this.linkTemplate   = options.linkTemplate  || el.firstElementChild;
		this.clipTemplate   = options.clipTemplate  || "&hellip;";
		this.activeClass    = options.activeClass   || "active";
		this.startLength    = undef === startLength  ? 1 : (+startLength  || 0);
		this.endLength      = undef === endLength    ? 1 : (+endLength    || 0);
		this.activeLength   = undef === activeLength ? 2 : (+activeLength || 0);
		this.length         = undef === length       ? 1 : (+length       || 0);
		this.active         = undef === active       ? 0 : (+active       || 0);
	}
	
	
	
	/**
	 * Create an element from a template variable. Internal use only.
	 *
	 * @private
	 * @param {Function|Node|String} template
	 * @param {Array} args - Arguments passed to template variable if it's a function
	 * @return {Node}
	 */
	_create(template, args){
		
		/** Short-circuit falsy values */
		if(!template) return;
		
		
		let result = template;
		
		/** Invoke a callback to generate the link element */
		if("function" === typeof template)
			result = template.apply(null, args);
		
		/** The callback returned a string, so use it to construct an HTML element */
		if("[object String]" === toString.call(result))
			result = this._parseHTML(result);
		
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
	createLink(index){
		let result = (
			this._create(this._linkTemplate, [index, this]) ||
			New("a", { href: "#" })
		).cloneNode(true);
		
		/** Set the link's text, unless an author used a callback (we'll assume they took care of that) */
		if("function" !== typeof this._linkTemplate){
			let label = deepest(result);
			if(!label.childNodes.length)
				label.appendChild(document.createTextNode(""));
			label.childNodes[0].data = index + 1;
		}
		
		
		result.addEventListener(pressEvent, e => {
			this.active = index;
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
	 * @private
	 * @param {Function|HTMLElement|String} input
	 * @return {Node}
	 */
	_parseTemplate(input){
		
		/** Short-circuit for falsy values */
		if(!input) return;
		
		
		/** DOM element */
		else if(input instanceof Element){
			
			/** Detach element from the DOM if it's attached */
			const parent = input.parentNode;
			parent && parent.removeChild(input);
			
			return input;
		}

		
		/** If it's a string, use it to construct a new HTML element */
		else if("[object String]" === toString.call(input))
			return this._parseHTML(input);
		
		
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
	_parseHTML(input){
		let frag = document.createDocumentFragment();
		let root = frag.appendChild(New("div"));
		root.insertAdjacentHTML("afterbegin", input);
		return root.removeChild(root.firstElementChild || root.firstChild);
	}
	
	
	
	/**
	 * Refresh the display of the pagination links with the current settings.
	 */
	rebuild(){
		if(!this.links[this._active]) return;
		
		/** Drop each link */
		const el = this.el;
		while(el.firstChild)
			el.removeChild(el.firstChild);
		
		
		const left  = this._active - this.activeLength;
		const right = this._active + this.activeLength;
		const end   = this._length - this.endLength;
		const children = [];
		
		/** Reattach leading range */
		for(let i = 0; i < this.startLength; ++i)
			children.push(el.appendChild(this.links[i]));
		
		
		/** Should we display a truncation indicator? */
		if(left > this.startLength)
			el.appendChild(this.leftClip);
		
		
		/** Display the active range */
		for(let i = Math.max(this.startLength, left); i <= Math.min(this._length - 1, right); ++i)
			children.push(el.appendChild(this.links[i]));
		
		
		/** Check if we should display a truncation indicator for the right-side too */
		if(right < end)
			el.appendChild(this.rightClip);
		
		
		/** Reattach trailing range */
		for(let i = end; i < this._length; ++i)
			children.push(el.appendChild(this.links[i]));
		
		/** Run through each node that was added and check their classes list */
		for(let i = 0, l = children.length; i < l; ++i){
			let elIndex = +children[i].getAttribute("data-index");
			children[i].classList[elIndex === this._active ? "add" : "remove"](this.activeClass);
		}
	}
	
	
	
	/**
	 * The blueprint used to generate new page links.
	 *
	 * @type {HTMLElement}
	 */
	get linkTemplate(){ return this._linkTemplate }
	set linkTemplate(input){
		
		/** No change? Don't bother */
		if(input === this._linkTemplate) return;
		
		this._linkTemplate = this._parseTemplate(input);
	}
	
	
	
	/**
	 * The blueprint for generating truncation indicators.
	 *
	 * @type {HTMLElement}
	 */
	get clipTemplate(){ return this._clipTemplate }
	set clipTemplate(input){
		
		/** Sanity check */
		if(input === this._clipTemplate) return;
		
		this._clipTemplate = this._parseTemplate(input);
		this.leftClip      = this._create(this._clipTemplate, "left");
		this.rightClip     = this._create(this._clipTemplate, "right");
	}
	
	
	
	/**
	 * Total number of pages that can be traversed using this instance.
	 *
	 * @type {Number}
	 */
	get length(){ return this._length || 0 }
	set length(input){
		input = +input;
		if(input < 1) input = 1;
		if(input !== this._length){
			
			/** We're extending the current page range */
			if(input > this._length)
				for(let i = this._length; i < input; ++i){
					let link = this.links[i];
					link || this.links.push(link = this.createLink(i));
					this.el.appendChild(link);
				}
			
			/** Shrinking the page range */
			else for(let i = this._length - 1; i >= input; --i){
				let link = this.links[i];
				if(link.parentNode)
					link.parentNode.removeChild(link);
			}
			
			this._length = input;
			
			/** The currently active index exceeds the new bounds. Cap it. */
			if(input <= this._active)
				this.active = input - 1;
			
			/** Otherwise, check clipping range */
			else this.rebuild();
		}
	}
	
	
	
	/**
	 * Zero-based index of the currently-selected link.
	 *
	 * Setting this property will trigger the onChange callback (if specified).
	 * Should the callback return an explicit value of `false`, the assignment is
	 * aborted and no change will be made to the instance's .active property.
	 *
	 * @type {Number}
	 */
	get active(){ return this._active || 0 }
	set active(input){
		input = +input;
		
		/** Ensure input falls within valid range */
		let l = this.length;
		if(input < 0)       input = 0;
		else if(input >= l) input = l - 1;
		
		if(input !== this._active){
			
			/** If there's an onChange callback provided, run it. Bail if it returns false. */
			if("function" === typeof this.onChange && false === this.onChange(input, this._active))
				return;
			
			this._active = input;
			this.rebuild();
		}
	}
}
