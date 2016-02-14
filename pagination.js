"use strict";

class Pagination{
	
	constructor(el, options = {}){
		this.el     = el;
		this.pages  = [];
		
		this.length = options.length || 20;
		this.active = options.active || 0;
	}
	
	createLink(index){
		let result = New("a", {
			textContent: index + 1,
			href: "#"
		});
		
		result.addEventListener()
		
		return result;
	}
	
	
	get length(){ return this._length || 0 }
	set length(input){
		input = +input;
		if(input < 1) input = 1;
		if(input !== this._length){
			
			
			/** We need more link elements */
			let numPages = this.pages.length;
			if(input > numPages){
				for(let i = numPages; i < input; ++i){
					let link = this.createLink(i);
					this.pages.push(this.el.appendChild(link));
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
