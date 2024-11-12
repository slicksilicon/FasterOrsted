import {Animator} from './animator.js';

// @ts-ignore
import sheet from './wait.css/' with {type : 'css'}
if (!document.adoptedStyleSheets.includes(sheet)){
    document.adoptedStyleSheets.push(sheet);
}


class Wait{
    /**
     * @param {string} parent
     */
    constructor(parent, attach=true){
        if (typeof parent === 'string'){
            this.parent = document.getElementById(parent);
            if (this.parent == null){
                console.error(`[Wait::constructor] Parent is not valid = ${parent}`);
                this.parent = document.createElement('div');
            }
        } else {
            this.parent = parent;
        }

        this.circles = ['circle_red', 'circle_green', 'circle_blue', 'circle_yellow'];
        this.message = ""; 
        this.state = 'stopped';
        this.range_top = 0;
        this.delay = 200;
        this.duration = 500;
        this.msg_timeout_id = null;
        this.div_wait = null;

        this.waitbox_width  = 0;
        this.waitbox_height = 0;
        this.waitbox_left_offset = 0;
        this.waitbox_top_offset = 0;        
        this.size = 0;
        
        this._calculate_waitbox();
        this.range_bottom = this.waitbox_height - this.size;
        this.animator = new Animator();
        if (attach == true){       
            this.attach();
        }
    }

    _calculate_waitbox(){
        let max_circle_size = 50;
        let circle_ratio = 0.3;
        let width_spacing = 10;

        let max_height = max_circle_size / circle_ratio;

        let height = this.parent.offsetHeight;
        if (height > max_height){
            height = max_height;
        }

        let width = 4 * ((circle_ratio * height) + width_spacing);
        if (width > this.parent.offsetWidth){
            width = this.parent.offsetWidth;
            height = ((width/4)-width_spacing) / circle_ratio;
            if (height <= 0){
                console.error("Height Width is too small");
            }
        }
        
        this.size = height * circle_ratio;
        this.waitbox_width = width;
        this.waitbox_height = height;

        this.waitbox_left_offset = (this.parent.offsetWidth - width)/2;
        if (this.waitbox_left_offset <0){
            this.waitbox_left_offset = 0;
        }

        this.waitbox_top_offset = (this.parent.offsetHeight - height)/2;
        if (this.waitbox_top_offset <0){
            this.waitbox_top_offset = 0;
        }
    }

    attach(){

        if (this.msg_timeout_id != null){
            clearTimeout(this.msg_timeout_id);
            this.msg_timeout_id = null;
            this._remove_div_wait();
            this._create_dom();
        } else if (this.div_wait == null){
            this._create_dom();
        }

        if (this._is_invalid(this.parent)){
            console.error("[Wait::attach] Invalid parent");
            return;
        }

        // @ts-ignore
        this.parent.appendChild(this.div_wait);
        this.state = 'running';
        this._animate();
    }

    /**
     * @param {string} message
     */
    stop(message, timeout=-1){
        this.message = message;
        this.state = 'stopping';
        this.animator.pause();
        
        if (this.message != ""){
            this._display_message(timeout);
        } else {
            this._remove_spans();
            this._remove_div_wait();
        }

    }

    _animate(){        
        for (let idx=0;idx<this.circles.length;idx++){
            this.animator.start_route(this.circles[idx], 'up_down', this.delay*idx);
        }
    }

    _finalize(){
        
    }

    _create_dom(){

        this._remove_spans();
        this._remove_div_wait();
       
        this.div_wait = document.createElement('div');
        this.div_wait.id = "id_wait";
        this.div_wait.classList.add('wait_div');

        this.div_wait.style.height = this._convert_to_px(this.waitbox_height);
        this.div_wait.style.width = this._convert_to_px(this.waitbox_width);
        this.div_wait.style.lineHeight = this._convert_to_px(this.waitbox_height);
        this.div_wait.style.left = this._convert_to_px(this.waitbox_left_offset);
        this.div_wait.style.top = this._convert_to_px(this.waitbox_top_offset);
        
        for (let idx=0;idx<this.circles.length;idx++){
            let name = this.circles[idx];
            let span_circle = document.createElement('span');
            span_circle.id = name + '_span_id';
            span_circle.classList.add('circle');
            span_circle.classList.add(name);
            span_circle.style.width =  this._convert_to_px(this.size);
            span_circle.style.height = this._convert_to_px(this.size);
            span_circle.style.top = this._convert_to_px(this.range_top);
            
            this.animator.add_element(name, span_circle);
            this.animator.add_route(name, "up_down", 'top', this.range_top, this.range_bottom, this.duration, 'reverse', undefined);

            this.div_wait.appendChild(span_circle);
        }
    }

    _remove_div_wait(){
        if (this.parent == null){
            return;
        }

        while (this.parent.lastChild) {
            this.parent.removeChild(this.parent.lastChild);
        }
        
        this.div_wait = null;
    }

    _remove_spans(){
        if (this.div_wait == null){
            return;
        }

        while (this.div_wait.lastChild){
            this.div_wait.removeChild(this.div_wait.lastChild);
        }
    }

    _is_valid(variable){
        if (typeof variable === 'undefined'){
            return false;
        }

        if (variable == null){
            return false;
        }

        return true;
    }

    /**
     * @param {HTMLElement | null} variable
     */
    _is_invalid(variable){
        return !this._is_valid(variable);
    }

    /**
     * @param {number} timeout
     */
    _display_message(timeout){
        if (this.div_wait == null){
            console.log("[Wait] Failed to display Message - div_wait is null");
            return
        }

        this._remove_spans();
        this.div_wait.innerHTML = this.message;

        if (timeout != -1){
            this.msg_timeout_id = setTimeout(this._display_message_remove.bind(this), timeout);
        }
    }

    _display_message_remove(){
        this._remove_div_wait();
        this.msg_timeout_id = null;
    }

    /**
     * @param {number} value
     */
    _convert_to_px(value){
        return String(value) + "px";
    }
}

export {Wait};
