import { DivCtrl } from './helpers.js';
import { register_ws_callback } from './global.js';

export class ProgressBar{
    /**
     * @param {string | HTMLElement} div
     * @param {'standard'|'striped'|'animated'} design
     * @param {'success'|'info'|'warning'|'danger'} color     
     */
    constructor(div, design, color){
        this.parent = DivCtrl(div, 'div');
        if (this.parent == null){
            console.error(`Div is invalid = ${div}`);
            this.parent = document.createElement('div');
        }

        this.design = design;
        this.color  = color;

        this.height = this.parent.offsetHeight - 10;
        this.width  = this.parent.offsetWidth - 10;        
        this.margin = {'left': 5, 'right': 5, 'top': 5, 'bottom': 5};

        this.font_size = 12;
        this.text_display = true;

        this.prog_bar = null;
        this.cookie = '';
    }

    /**
     * @param {number} height
     * @param {number} width
     * @param {number} margin
     */
    set_size(height, width, margin){
        this.height = height;
        this.width  = width;
        this.margin = {'left': margin, 'right': margin, 'top': margin, 'bottom': margin};
    }

    /**
     * @param {number} font_size
     */
    set_font_size(font_size){
        this.font_size = font_size;
    }

    /**
     * @param {boolean} display
     */
    set_text_display(display){
        this.text_display = display;
    }

    /**
     * @param {{'height': number, 'width': number, 'margin': {'left': number, 'right': number, 'top': number, 'bottom': number,}}} size
     * @param {string} id
     * @param {'row'|'column'} direction
     * @param {HTMLElement} parent
     */
    _create_div(size, id, direction, parent){
        let div = document.createElement('div');
        div.id = id;
        div.style.display = 'flex';
        div.style.flexDirection = direction;
        div.style.justifyContent = 'center';
        div.style.alignItems = 'center';
        div.style.height = `${size.height}px`;
        div.style.width  = `${size.width}px`;
        div.style.marginLeft = `${size.margin.left}px`;
        div.style.marginRight = `${size.margin.right}px`;
        div.style.marginTop = `${size.margin.top}px`;
        div.style.marginBottom = `${size.margin.bottom}px`;

        parent.appendChild(div);

        return div;
    }

    _create_blank_size(){
        return {'height': 0, 'width': 0, 'margin': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0,}}
    }

    /**
     * @param {'height'|'width'} direction
     * @param {{'height': number, 'width': number, 'margin': {'left': number, 'right': number, 'top': number, 'bottom': number,}}} size
     */
    _get_size(direction, size){
        if (direction == 'height'){
            return size.height + size.margin.bottom + size.margin.top;
        }

        return size.width + size.margin.left + size.margin.right
    }

    /**
     * @param {HTMLElement} parent
     * @param {{'height': number, 'width': number, 'margin': {'left': number, 'right': number, 'top': number, 'bottom': number,}}} size
     */
    _create_bar(size, parent){
        let div = document.createElement('div');
        div.classList.add('progress');
        div.style.height = `${size.height}px`;
        div.style.width = `${size.width}px`;

        parent.appendChild(div);

        let prg_div = document.createElement('div');
        prg_div.classList.add('progress-bar');
        if (this.design != 'standard'){
            prg_div.classList.add('progress-bar-striped');                        
        }

        if (this.design == 'animated'){
            prg_div.classList.add('progress-bar-animated');
        }

        prg_div.classList.add(`bg-${this.color}`);

        prg_div.role = 'progressbar';
        prg_div.style.width = '0%';
        prg_div.ariaValueNow = '0';
        prg_div.ariaValueMin = '0';
        prg_div.ariaValueMax = '100';

        div.appendChild(prg_div);
        
        return prg_div;
    }
    

    _calc(){
        /* Outer Box */
        let outer = this._create_blank_size();
        outer.height = this.height - (this.margin.bottom + this.margin.top);
        outer.width  = this.width  - (this.margin.right  + this.margin.left);
        outer.margin.left = 5;
        outer.margin.right = 5;
        outer.margin.top = 5;
        outer.margin.bottom =5;

        /* Text Box at the bottom */
        let text_box = this._create_blank_size();
        text_box.height = (this.text_display == true) ? this.font_size * 1.5 : 0;
        text_box.margin.top = 5;
        
        /* Percentage Progress */
        let text_prg = this._create_blank_size();
        text_prg.width = this.font_size * 4;

        /* Bar Size - Height */
        let bar = this._create_blank_size();
        bar.height  = this.height - (this._get_size('height', text_box)) - (this.margin.top + this.margin.bottom);
        bar.height = (bar.height > 100) ? 100 : bar.height;

        /* Bar Size - Width */
        bar.width = this.width - text_prg.width - (this.margin.left + this.margin.right);

        /* Mimic bar Size */
        text_box.width  = this._get_size('width', bar) + this._get_size('width',text_prg) - 3;
        text_prg.height = bar.height;

        return {'outer': outer, 'bar': bar, 'text_box' :text_box, 'text_prg' : text_prg}
    }


    draw(){
        let sizes = this._calc();
        let outer_div = this._create_div(sizes.outer, 'outer_id', 'column', this.parent);
        
        let bar_container = sizes.outer;
        bar_container.height = sizes.bar.height;
        let bar_div   = this._create_div(bar_container, 'bar_div_id', 'row', outer_div);
        
        let prg_bar = this._create_bar(sizes.bar, bar_div);
        let prg_text_div = this._create_div(sizes.text_prg, 'prg_text_id', 'column', bar_div);   
        prg_text_div.style.fontWeight = '600';     
        
        let text_box_div = this._create_div(sizes.text_box, 'text_box_id', 'row', outer_div);
        text_box_div.style.justifyContent ='left';
        text_box_div.style.fontSize = `${this.font_size}px`;
        text_box_div.style.fontWeight = '600';

        this.prog_bar = {'bar': prg_bar, 'text': text_box_div, 'progress': prg_text_div};
    }


    _websocket_callback(message){
        if (message.cookie != this.cookie){
            console.error(`Unexpected cookie in message`);
            return;
        }

        this.update(message.payload.progress, message.payload.msg)
    }
    
    /**
     * @param {string} cookie
     */
    set_websocket(cookie){
        this.cookie = cookie;
        register_ws_callback('progress_bar_update', this._websocket_callback.bind(this));
    }
    
    /**
     * @param {number} progress - 0 to 100
     * @param {string} text_info
     */
    update(progress, text_info){
        if (this.prog_bar == null){
            console.error(`Progress Bar still not drawn as yet`);
            return;
        }

        this.prog_bar.bar.style.width = `${progress}%`;
        this.prog_bar.bar.ariaValueNow = `${progress}`;
        this.prog_bar.progress.innerHTML = `${progress}%`;        
        this.prog_bar.text.innerHTML = text_info;        
    }


}