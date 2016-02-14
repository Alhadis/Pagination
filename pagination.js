"use strict";

class Pagination{
	
	constructor(el, options = {}){
		this._length = 0;
		this.pages   = [];
		
		this.el      = el;
		this.length  = options.length || 20;
		this.active  = options.active || 10;
	}
	
	createLink(index){
		let result = New("a", {
			textContent: index,
			href: "#"
		});
		
		result.addEventListener(pressEvent, e => {
			this.active = index;
			e.preventDefault();
			return false;
		});
		
		return result;
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
			else{
				
				/** The currently active index exceeds the new bounds. Cap it. */
				if(input <= this._active)
					this.active = input - 1;
				
				for(let i = this._length - 1; i >= input; --i){
					let link = this.pages[i];
					if(link.parentNode)
						link.parentNode.removeChild(link);
				}
			}
			
			this._length = input;
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
