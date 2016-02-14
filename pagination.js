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
	
	createLink(index){
		let result;
		
		switch(this._linkTemplateType){
			
			/** No template defined; just use a new <a> tag */
			default:{
				result = New("a", {textContent: index, href: "#"});
				break;
			}
			
			case 1:{
				result    = this._linkTemplate.cloneNode(true);
				let label = deepest(result);
				if(!label.childNodes.length)
					label.appendChild(document.createTextNode(""));
				label.childNodes[0].data = index;
				break;
			}
			
			/** Invoke a callback to generate the link element */
			case 2:{
				result = this._linkTemplate(index, this);
				break;
			}
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
	 * @param {Function|HTMLElement|String} input
	 * @return {Array}
	 * @private
	 */
	parseTemplate(input){
		
		/** Short-circuit for falsy values */
		if(!input) return ["", 0];
		
		
		/** DOM element */
		else if(input instanceof Element){
			
			/** Detach element from the DOM if needed */
			const parent = input.parentNode;
			parent && parent.removeChild(input);
			
			return [input, 1];
		}

		
		/** If it's a string, use it to construct a new HTML element */
		else if("[object String]" === toString.call(input)){
			let frag = document.createDocumentFragment();
			let root = frag.appendChild(New("div"));
			let result;
			root.insertAdjacentHTML("afterbegin", input);
			root.removeChild(result = root.firstElementChild);
			return [result, 1];
		}
		
		/** Alternatively, accept a function that returns an element */
		else if("function" === typeof input)
			return [input, 2];
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
		
		let template           = this.parseTemplate(input);
		this._linkTemplate     = template[0];
		this._linkTemplateType = template[1];
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
