import { DivCtrl } from "./helpers.js";

const INPUT_HEIGHT = '37.33px';
const INPUT_MARGIN = '1px';
const LABEL_WIDTH  = '250px';
const BTN_WIDTH    = '50px';

class InputBase{
    /**
     * @param {HTMLElement|string} div
     * @param {string} label
     */
    constructor(div, label){
        this.parent = DivCtrl(div, 'div');
        if (this.parent == null){
            console.error(`Invalid div = ${div}`);
            this.parent = document.createElement('div');
        }
        /* Label */
        this.label = `<html><body><div>${label}</div></body></html>`;

        /* Number of Inputs */
        this.input_count = 0;

        /* Draw Input */
        this.div_input_group = this._draw();        
    }

    /**
     * @param {PointerEvent} event
     */
    _callback_btn_clicked(event){
        console.error(`This function must be override by Child Class`);
    }

    _draw(){
        console.error(`This function must be override by Child Class`);
        return document.createElement('div');
    }
    
    /**
     * @param {string} label
     * @param {string} color     
     */
    _create_btn(label, color){
        /* Create Button - Add */
        let btn = document.createElement('button');        
        btn.classList.add('btn');
        btn.classList.add(`btn-outline-${color}`);
        btn.type = 'button';
        btn.style.height = INPUT_HEIGHT;
        btn.style.width  = BTN_WIDTH;
        btn.style.margin = INPUT_MARGIN;

        btn.innerHTML = label;
        btn.id = label;
        
        btn.addEventListener('click', this._callback_btn_clicked.bind(this));

        return btn;
    } 

    /**
     * @param {string | null} margin
     * @param {number|string} id
     * @param {string|null} background
     */
    _create_input(margin, id, background){
        let input = document.createElement('input');
        input.type = 'text';
        input.classList.add('form-control');
        input.id = `input_${id}`;
        input.style.height = INPUT_HEIGHT;
        input.style.margin = (margin == null) ? INPUT_MARGIN : margin;

        if (background != null){
            input.style.backgroundColor = background;
        }

        return input;
    }

    _create_outer_and_label(){
        /* Outer Container Div */
        let div_outer = document.createElement('div');
        div_outer.classList.add('input-group');
        div_outer.style.height = INPUT_HEIGHT;                

        /* Create Prepend Label Div */
        let div_label = document.createElement('div');
        div_label.classList.add('input-group-prepend');  
        
        /* Create Prepend Label */
        let span = document.createElement('span');
        span.classList.add('input-group-text');
        span.style.height = INPUT_HEIGHT;
        span.style.margin = INPUT_MARGIN;
        span.style.width  = LABEL_WIDTH;
        span.innerHTML = this.label;
        
        /* Append Children to Divs */
        div_label.appendChild(span);
        div_outer.appendChild(div_label);

        this.parent.appendChild(div_outer);
        
        return div_outer;
    }

    /**
     * @param {{'name': string;'color': string;}[]} btn_list     
     */
    _create_buttons_group(btn_list){
        /* Create Append Button Div */
        let div_btn = document.createElement('div');
        div_btn.classList.add('input-group-append');
        div_btn.style.backgroundColor = 'lightgrey'

        for (let btn_info of btn_list){
            let btn = this._create_btn(btn_info.name, btn_info.color);
            div_btn.appendChild(btn);
        }  
        
        return div_btn;
    }
       
}

export class InputArray extends InputBase{
    /**
     * @param {HTMLElement|string} div
     * @param {string} label
     */
    constructor(div, label){
        super(div, label);

        /* Initially Add One Input */
        this.add_input();
    }

    /**
     * @param {PointerEvent} event
     */
    _callback_btn_clicked(event){
        // @ts-ignore
        if (event.target.id == 'Add'){
            this.add_input();
            return;
        }

        // @ts-ignore
        if (event.target.id == 'Del'){
            this.del_input();
            return;
        }
    }
    _draw(){
        let div_outer = this._create_outer_and_label();

        let btn_info = [{'name': 'Add', 'color': 'success'}, {'name': 'Del', 'color': 'danger'}];
        /* Create Button */
        let btns = this._create_buttons_group(btn_info);
        div_outer.appendChild(btns);

        return div_outer;
    }

    /**
     * @param {number} idx
     */
    _get_value(idx){
        let id = `#input_${idx}`;
        let found = this.div_input_group.querySelector(id);
        if (found == null){
            console.error(`Could not find element with id = ${id}`);
            return 'error!';
        }

        // @ts-ignore
        return found.value;
    }

    add_input(){
        let input = this._create_input(null, this.input_count, null);
        this.div_input_group.appendChild(input);

        this.input_count++;
    }

    del_input(){
        let id = `#input_${this.input_count-1}`;
        let found = this.div_input_group.querySelector(id);
        if (found == null){
            console.error(`Could not find ${id}`);
            return;
        }

        this.div_input_group.removeChild(found);
        this.input_count--;
    }

    read(){
        let result = [];
        for(let idx=0;idx<this.input_count;idx++){
            let value = this._get_value(idx);
            result.push(value);
        }

        return result;
    }
}

export class InputDictionary extends InputBase{
    /**
     * @param {string | HTMLElement} div
     * @param {string} label
     * @param {boolean} add_blank
     */
    constructor(div, label, add_blank){
        super(div, label);         

        if (add_blank == true){
            this.add_input(null);
        }        
    }

    _draw(){
        let div_outer = this._create_outer_and_label();
        let btn_info = [{'name': 'Add', 'color': 'success'}, {'name': 'Del', 'color': 'danger'}];
        let btns = this._create_buttons_group(btn_info);
        div_outer.appendChild(btns);

        return div_outer;
    }

    /**
     * @param {number} idx
     * @param {'key'|'value'} type
     */
    _get_input(idx, type){
        let id = `#input_${type}_${idx}`;
        let found = this.div_input_group.querySelector(id);

        return found;
    }

    /**
     * @param {number} idx
     * @param {'key'|'value'} type
     */
    _get_value(idx, type){
        let container = this._get_input(idx, type);
        if (container == null){
            console.error(`Failed to get input for ${idx} + ${type}`);
            return ''
        }

        // @ts-ignore
        return container.value;
    }

    /**
     * @param {PointerEvent} event
     */
    _callback_btn_clicked(event){
        // @ts-ignore
        if (event.target.id == 'Add'){
            this.add_input(null);
            return;
        }

        // @ts-ignore
        if (event.target.id == 'Del'){
            this.del_input();
            return;
        }
    }

    /**
     * @param {null|string} key
     */
    add_input(key){

        let input_key   = this._create_input('0px', `key_${this.input_count}`, 'aliceblue');
        let input_value = this._create_input('0px', `value_${this.input_count}`, null);

        if (key != null){
            input_key.value = key;
            input_key.tabIndex = -1;
        }

        this.div_input_group.appendChild(input_key);
        this.div_input_group.appendChild(input_value);

        this.input_count++;
    }

    del_input(){
        let key_id = `#input_key_${this.input_count-1}`;
        let value_id = `#input_value_${this.input_count-1}`;

        let found_key = this._get_input(this.input_count-1, 'key');
        let found_value = this._get_input(this.input_count-1, 'value');

        if (found_key == null || found_value == null){
            console.error(`Could not find either/and = ${key_id} ${value_id}`);
            return;
        }

        this.div_input_group.removeChild(found_key);
        this.div_input_group.removeChild(found_value);

        this.input_count--;

    }

    read(){
        let parameter = {};
        for (let idx=0;idx<this.input_count;idx++){
            let key = this._get_value(idx, 'key');
            let value = this._get_value(idx, 'value');
            parameter[key] = value;
        }

        return parameter;

    }
}

export class InputSimple extends InputBase{
    /**
     * @param {string | HTMLElement} div
     * @param {string} label
     * @param {'str'|'int'|'float'} type
     */
    constructor(div, label, type){
        super(div, label);
        this.my_type = type;
        this.add_input();
    }

    _draw(){
        let outer = this._create_outer_and_label();   
        return outer;     
    }

    add_input(){
        let background = (this.my_type == 'str') ? 'alicewhite' : 'lightslategrey';
        let input = this._create_input(null, 0, background);
        this.div_input_group.appendChild(input);
        this.input_count++;
    }

    read(){
        let input = this.parent.querySelector('#input_0');
        if (input == null){
            console.error(`Failed to Read Input`);
            return null;
        }

        // @ts-ignore
        return input.value;
    }
}