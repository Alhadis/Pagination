"use strict";

class Pagination{
	
	constructor(el, options = {}){
		this._length        = 0;
		this.pages          = [];
		
		this.el             = el;
		this.linkTemplate   = options.linkTemplate;
		this.length         = options.length || 20;
		this.active         = options.active || 10;
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
			New("a", { textContent: index, href: "#" })
		).cloneNode(true);
		
		/** Set the link's text, unless an author used a callback (we'll assume they took care of that) */
		if("function" !== typeof this._linkTemplate){
			let label = deepest(result);
			if(!label.childNodes.length)
				label.appendChild(document.createTextNode(""));
			label.childNodes[0].data = index;
		}
		
		
		result.addEventListener(pressEvent, e => {
			this.active = index;
			e.preventDefault();
			return false;
		});
		
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
	
	
	
	get length(){ return this._length || 0 }
	set length(input){
		input = +input;
		if(input < 1) input = 1;
		if(input !== this._length){
			
			/** We're extending the current page range */
			if(input > this._length)
				for(let i = this._length; i < input; ++i){
					let link = this.pages[i];
					link || this.pages.push(link = this.createLink(i));
					this.el.appendChild(link);
				}
			
			/** Shrinking the page range */
			else for(let i = this._length - 1; i >= input; --i){
				let link = this.pages[i];
				if(link.parentNode)
					link.parentNode.removeChild(link);
			}
			
			this._length = input;
			
			/** The currently active index exceeds the new bounds. Cap it. */
			if(input <= this._active)
				this.active = input - 1;
		}
	}
	
	
	get active(){ return this._active || 0 }
	set active(input){
		input = +input;
		
		/** Ensure input falls within valid range */
		let l = this.length;
		if(input < 0)       input = 0;
		else if(input >= l) input = l - 1;
		
		if(input !== this._active){
			let link = this.pages[this._active];
			link && link.classList.remove("active");
			
			this._active = input;
			
			(link = this.pages[input]) && link.classList.add("active")
		}
	}
}
