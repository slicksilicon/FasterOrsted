import { DivCtrl, GetType, AdjustFontSizeHtml } from "./helpers.js";
import {GetCtrl} from "./fetch.js"; 
import { CreateElement } from "../../FasterOrsted/FE/CreateElement.js";
import {TriState, TRISTATE_POSITIVE, TRISTATE_NEGATIVE, TRISTATE_IGNORE} from "../../FasterOrsted/FE/TypeTristate.js";


// @ts-ignore
import sheet from '../static/widget.css' with { type: 'css'}
if (!document.adoptedStyleSheets.includes(sheet)){
    document.adoptedStyleSheets.push(sheet);
}

const OPTION_DEFAULT = "Please Select ...";
const DIV_TITLE_ID  = 'title_div_id';

export class SelectorStyles{
    constructor(){
        this.styles = {};        
    }

    /**
     * @param {{ radio_item: string; radio_text: string; radio_circle: string; }} styles
     */
    set(styles){
        if (GetType(styles) != 'dict'){
            console.error(`Styles Must be a dict {key = style_name : value = default_class}`);
            return;
        }

        this.styles = Object.assign(this.styles, styles);      
    }

    /**
     * @param {string | number} key
     * @param {any} style
     */
    add(key, style){
        if (GetType(key) != 'string' || GetType(style) != 'string'){
            console.error(`add parameters must be strings and not ${key} and ${style}`);
            return;
        }

        this.styles[key] = style;
    }

    /**
     * @param {{ classList: { add: (arg0: any) => void; }; }} element
     * @param {string} style_name
     */
    set_element_style(element, style_name){
        if (!(style_name in this.styles)){
            console.error(`Requested Style [${style_name}] not in styles = ${JSON.stringify(this.styles)}`);
            return;
        }

        if (!(element instanceof HTMLElement)){
            console.error(`Element must be of type HTMLElement`);
            return;
        }

        if (this.styles[style_name] != null){
            element.classList.add(this.styles[style_name]);
        }
    }
}

export class SelectorOptions{
    /**
     * @param {Boolean} initial_default forces in insertion of OPTION_DEFAULT as the first selectable option
     */
    constructor(initial_default){
        this.options = [];        

        if (typeof initial_default !== 'boolean'){
            console.error(`initial_default must be a bool and not ${typeof initial_default}`)
            this.initial_default = false;
        }
        else {
            this.initial_default = initial_default;
        }
        
        this.initial_idx = -1; 
        this.cmd = null;               
    }

    /**
     * 
     * @param {Array|Object} options 
     * @param {string|null} initial 
     * @returns 
     */
    async set(options, initial){
        if (GetType(options) == 'array'){
            this.options = [...options];            
        }

        if (GetType(options) == 'dict'){
            if (typeof options.cmd === 'undefined'){
                console.error(`cmd missing from parameter [${options}]`);                
                this.options.length = 0;
                this.initial_idx = -1;
                return;
            }

            this.cmd = options.cmd;
            let result = await GetCtrl(options.cmd, options.param, true);
            return this.set(result, initial);
        }

        if (this.options.length == 0){
            console.log(`No Options found`);
            this.initial_idx = -1;
            return;
        }

        if (this.initial_default == true){
            this.initial(OPTION_DEFAULT);
            return;
        }

        this.initial(initial);
    }

    /**
     * @param {string} option
     */
    add_option(option){
        this.options.push(option);
    }

    /**
     * @param {string} option
     */
    includes(option){
        return this.options.includes(option);
    }

    length(){
        return this.options.length;
    }

    /**
     * @param {string|null} initial
     */
    initial(initial){        
        if (typeof initial !== 'string'){
            return;
        }

        if (initial == OPTION_DEFAULT){
            this.options.unshift(OPTION_DEFAULT);
            this.initial_idx = 0;
            return;
        }
            
        this.initial_idx = this.options.indexOf(initial);
    }

    /**
     * @param {any} option
     */
    is_initial(option){
        let idx = this.options.indexOf(option);
        if (idx == this.initial_idx){
            return true;
        }

        return false;
    }

    /**
     * @param {number} offset
     */
    get_options_by_offset(offset){
        if (offset >= this.options.length){
            console.log(`Offset ${offset} > size of options ${this.options.length}`);
            return null;
        }

        return this.options[offset];
    }

    /**
     * @param {HTMLElement} container
     * @param {boolean} single
     * @return {string|string[]}
     */
    get_selected(container, single){
        let selected = [];
        for (let idx=0;idx<container.children.length;idx++){
            let child = container.children[idx];

            // @ts-ignore
            if (child.tagName == 'OPTION' && child.selected == true){
                if (child.innerHTML != OPTION_DEFAULT){            
                    selected.push(child.innerHTML);
                }
                continue;
            }

            if (child.tagName == 'DIV'){
                let grandchild_label = child.querySelector('label');
                let grandchild_input = child.querySelector('input');

                if (typeof grandchild_input === 'undefined' || typeof grandchild_label === 'undefined' || grandchild_input == null || grandchild_label == null){
                    // @ts-ignore
                    console.log(`grandchild is invalid ${child.tag} item number = ${idx}`);
                    continue;
                }

                if (grandchild_input.checked == true){
                    selected.push(grandchild_label.innerHTML);
                }
            }
        }

        if (single == true){
            if (selected.length != 1){
                // console.log(`Something is wrong for ${single} length should be 1 but it is ${selected.length}`);
                return '';
            }

            return selected[0];
        }

        return selected;
    }


    /**
     * Returns state of options in their tristate state
     * @param {HTMLElement} container
     * @param {boolean} ignore doesn't include items in IGNORE state
     * @returns {object} state in TriState Values
     * @param {any} state_bool
     */
    get_selection_state(container, ignore, state_bool){
        let state = {}
        for (let idx=0;idx<container.children.length;idx++){
            let child = container.children[idx];

            if (child.tagName == 'DIV'){
                let grandchild_label = child.querySelector('label');
                let grandchild_input = child.querySelector('input');

                if (typeof grandchild_input === 'undefined' || typeof grandchild_label === 'undefined' || grandchild_input == null || grandchild_label == null){
                    // @ts-ignore
                    console.log(`grandchild is invalid ${child.tag} item number = ${idx}`);
                    continue;
                }

                let tristate = null;
                if (grandchild_input.checked == true && grandchild_input.indeterminate == false){                    
                    tristate = new TriState(TRISTATE_POSITIVE);
                } else if (grandchild_input.checked == false && grandchild_input.indeterminate == true){
                    tristate = new TriState(TRISTATE_NEGATIVE);
                } else if (ignore == false && grandchild_input.checked == false && grandchild_input.indeterminate == false){
                    tristate = new TriState(TRISTATE_IGNORE);
                }

                if (tristate != null){
                    if (state_bool){
                        state[grandchild_label.innerHTML] = tristate.get_bool();
                    }
                    else {
                        state[grandchild_label.innerHTML] = tristate.get();
                    }
                }
            }
        }

        return state;
    }

    /**
     * @param {HTMLElement} container
     * @param {string|string[]} options
     * @param {boolean} state
     */
    set_check_options(container, options, state){
        /* convert string to array */
        if (typeof options === 'string'){
            options = [options];
        }

        for (let idx=0;idx<container.children.length;idx++){
            let child = container.children[idx];

            if (child.tagName == 'option'){            
                /* for Drop Down Box only does first item in array */
                if (options.includes(child.innerHTML) == true){
                    // @ts-ignore
                    child.selected = state;
                    return;
                }
                continue;
            }

            if (child.tagName == 'DIV'){
                let grandchild_label = child.querySelector('label');
                let grandchild_input = child.querySelector('input');

                if (typeof grandchild_input === 'undefined' || typeof grandchild_label === 'undefined' || grandchild_input == null || grandchild_label == null){
                    // @ts-ignore
                    console.log(`grandchild is invalid ${child.tag} item number = ${idx}`);
                    continue;
                }

                if (options.includes(grandchild_label.innerHTML) == true){
                    grandchild_input.checked = state;
                    continue;
                }
            }
        }
    }
}

export class SelectorDirection{
    constructor(){
        this.direction = null;        
    }

    /**
     * @param {'vertical'|'horizontal'} direction
     * @param {HTMLElement} container
     */
    set(direction, container, keep_size=false){
        /* Set Direction */
        if (direction != 'vertical' && direction != 'horizontal'){
            console.error(`Directions should be either horizontal or vertical only and not ${direction}`);
            this.direction = null;
            return;
        }

        if (container == null || typeof container === 'undefined'){
            console.error(`Container parameter not set`);
            return;
        }

        this.direction = direction;
        this.keep_size = keep_size;

        container.style.display = 'flex';
        if (this.direction == 'vertical'){            
            container.style.flexDirection = 'column';
        } else {
            container.style.flexDirection = 'row';
        }

        container.style.flexWrap = 'wrap';

        if (this.keep_size == false){
            container.style.height = 'auto';
        }
    }

    /**
     * @param {HTMLElement} container
     */
    hide(container){
        container.style.display = 'none';
    }
    /**
     * @param {HTMLElement} container
     */
    unhide(container){
        container.style.display = 'flex';
    }
    
    get(){
        return this.direction;
    }
}

export class SelectorSize{
    
    /**
     * @param {string | HTMLElement} container
     * @param {boolean} vertical
     * @param {boolean} label
     * @param {number | null} width
     * @param {number | null} height
     */
    constructor(container, vertical, label, width, height){
        this.container = DivCtrl(container, 'div');        
        this.vertical = vertical;
        this.label = label;
        this.size_input = {};
        this.size_title = {'fontSize': 24};
        this.width = (width == null) ? 150 : width;
        this.height = (height == null) ? ((this.vertical == true) ? 75 : 40) : height;
        this.margin = {};        
        
        this._default_size();
    }

    _default_size(){
        if (this.vertical == true && this.label != null){        
            this.set_size(this.height, this.width, 30, 5, 5, 5, 5, 5);
            return;
        }

        if (this.vertical == true && this.label == null){
            this.set_size(this.height, this.width, 0, 5, 5, 5, 5, 0);
            return;
        }

        if (this.vertical == false && this.label != null){

            let width = (this.get_container_width() > 400) ? 400 : this.get_container_width();
            let title_width = (width > 400) ? width - 200 : (width / 2);

            this.set_size(this.height, width, title_width, 5, 5, 5, 5, 4);
            return;
        }

        if (this.vertical == false && this.label == null){
            let width = (this.get_container_width() > 250) ? 250 : this.get_container_width();
            this.set_size(this.height, width, 0, 5, 5, 5, 5, 0);
            return;
        }
    }

    /**
     * 
     * @returns Return container height in int
     */
    get_container_height(){
        if (this.container.constructor.name == "CreateElement"){
            // @ts-ignore
            let height = this.container.get_height();
            return height;
        }

        return this.container.offsetHeight;
    }
    
    /**
     * 
     * @returns Returns container width in int
     */
    get_container_width(){
        if (this.container.constructor.name == "CreateElement"){
            // @ts-ignore
            let width = this.container.get_width();
            return width;    
        }

        return this.container.offsetWidth;
    }
    

    /**
     * @param {Number} total_height Total width in px for both title and stepper
     * @param {Number} total_width height for both
     * @param {Number} margin_left left margin in px
     * @param {Number} margin_right right margin in px
     * @param {Number} margin_top top margin in px
     * @param {Number} margin_bottom bottom margin in px
     * @param {Number} spacing spacing between title and input
     * @param {number} title_size
     */
    set_size(total_height, total_width, title_size, margin_left, margin_right, margin_top, margin_bottom, spacing){
        
        this.margin = {'left': margin_left, 'right': margin_right, 'top': margin_top, 'bottom': margin_bottom, 'spacing': spacing};

        if (this.vertical == true){
            this._set_size_vertical(total_height, total_width, title_size, spacing);
            return;
        }

        this._set_size_horizontal(total_height, total_width, title_size, spacing);
    }
    
    /**
     * @param {number} fontsize
     */
    set_fontsize(fontsize){
        let div_title = this.container.querySelector(`#${DIV_TITLE_ID}`);
        if (div_title == null){
            this.size_title.fontSize = fontsize;
            return;
        }     

        div_title.setAttribute('fontSize', `${fontsize}px`);
        // @ts-ignore
        this.size_title.fontSize = AdjustFontSizeHtml(div_title);
    }
    
    /**
     * @param {number} total_height
     * @param {number} total_width
     * @param {number} title_size
     * @param {number} spacing
     */
    _set_size_vertical(total_height, total_width, title_size, spacing){
        let height_nett = total_height - spacing;

        this.size_title.height = title_size;
        this.size_input.height = height_nett - this.size_title.height;

        this.size_title.width = total_width;
        this.size_input.width = total_width;                
    }

    /**
     * @param {number} total_height
     * @param {number} total_width
     * @param {number} title_size
     * @param {number} spacing
     */
    _set_size_horizontal(total_height, total_width, title_size, spacing){
        let width_nett = total_width - spacing;
        this.size_title.width = title_size;
        this.size_input.width = width_nett - this.size_title.width;

        this.size_title.height = total_height;
        this.size_input.height = total_height;
    }

    get_div_outer(){
        let width = (this.vertical == true) ? this.size_title.width : this.size_input.width + this.size_title.width + this.margin.spacing;
        let height = (this.vertical == true) ? this.size_title.height + this.size_input.height + this.margin.spacing : this.size_title.height;
        let direction = (this.vertical == true)? 'column' : 'row';        

        let outer = new CreateElement('div', {'display': 'flex', 'flexDirection': direction, 'height': height, 'width': width, 
                                            'marginLeft': this.margin.left, 'marginRight': this.margin.right, 'marginTop': this.margin.top, 'marginBottom': this.margin.bottom},
                                             ['myselect_base']);
        outer.set_id('outer'); 

        return outer;
    }

    /**
     * @param {HTMLElement} parent
     */
    get_div_input(parent){                    
        let style_div   = {'height' : this.size_input.height, 'width': this.size_input.width, 'display':'flex', 'flexDirection': 'row'};
        if (this.vertical == true){
            style_div['marginTop'] = this.margin.spacing;
        } else {
            style_div['marginLeft'] = this.margin.spacing;
        }
        
        let input = new CreateElement('div', style_div, ['myselect_base']);
        input.set_id('input');

        input.append(parent);

        return input;
    }

    /**
     * @param {string} title
     * @param {HTMLElement} parent
     */
    get_div_title(title, parent){
        let textAlign = (this.vertical == true) ? 'center' : 'left';
        let style_title = {'height': this.size_title.height, 'width': this.size_title.width, 'lineHeight': this.size_title.height, 'fontSize': this.size_title.fontSize, 'fontWeight':'Bold','textAlign': textAlign};

        let div_title = new CreateElement('div', style_title, ['myselect_base']);
        div_title.set_innerHTML(title);
        div_title.set_id(DIV_TITLE_ID);

        div_title.append(parent);
        // @ts-ignore
        this.size_title.fontSize = AdjustFontSizeHtml(div_title);

        return div_title;
    }

    get_size_input(){
        return this.size_input;
    }

    get_size_title(){
        return this.size_title;
    }
    
    get_title_fontsize(){
        return this.size_title.fontSize;
    }
}

export class SelectorCallback{
    constructor(){
        this.callback = [];      
        this.fire_async = false; 
        this.disable = false; 
    }

    set_fire_async(){
        this.fire_async = true;
    }

    /**
     * @param {boolean} disable
     */
    set_disable(disable){
        this.disable = disable;
    }


    /**
     * @param {Function|null} callback
     * @param {boolean} front
     */
    add(callback, front=false){
        if (callback == null){
            return;
        }
        
        let mytype = GetType(callback);
        if (mytype == 'undefined'){
            return;
        }

        if (mytype != 'function'){
            console.error(`callback must be of type function and not ${typeof callback}`);
            return;
        }

        if (this.fire_async == true){            
            if (callback.constructor.name != 'AsyncFunction'){
                console.error(`callback is not Async ${callback}`);
                return;
            }
        }

        if (front == true){
            this.callback.unshift(callback);
            return;
        }

        this.callback.push(callback);
        return;
    }    

    /**
     * @param {function} callback
     */
    remove(callback){
        let mytype = GetType(callback);
        if (mytype != 'function'){
            console.error(`callback must be of type function and not ${mytype}`);
            return;
        }

        let idx = this.callback.indexOf(callback);
        if (idx == -1){
            console.error(`function ${callback} not in list of callbacks ${this.callback}`);
            return;
        }

        this.callback.splice(idx,1);
    }

    /**
     * @param {any} parameters
     */
    // @ts-ignore
    async fire(parameters){      
        if (this.disable == true){
            return;
        }          

        let args = Array.from(arguments);

        for (const callback of this.callback){
            if (this.fire_async == true){
                await callback(...args);
                continue;
            }
            
            callback(...args);    
        }
    }
}

export class SelectorBaseRadioCtrl{

    static SELECTOR_RADIO_MULTI = 'RADIO_MULTI';
    static SELECTOR_RADIO_TOGGLE = 'RADIO_TOGGLE';
    static SELECTOR_CHECK_TRISTATE = 'CHECK_TRISTATE';

    /**
     * @param {string | HTMLElement} div
     * @param {'horizontal'|'vertical'} direction
     * @param {any} name
     * @param {Function} callback
     * @param {string} type
     */
    constructor(div, direction, name, callback, type, prioritize_container_size=false){
        /* Set Container */
        this.container = DivCtrl(div, 'div');

        /* Set Child Type */
        if (type != SelectorBaseRadioCtrl.SELECTOR_RADIO_MULTI && type != SelectorBaseRadioCtrl.SELECTOR_RADIO_TOGGLE && type != SelectorBaseRadioCtrl.SELECTOR_CHECK_TRISTATE){
            console.error(`type parameter must either ${SelectorBaseRadioCtrl.SELECTOR_RADIO_MULTI} or ${SelectorBaseRadioCtrl.SELECTOR_RADIO_TOGGLE} or ${SelectorBaseRadioCtrl.SELECTOR_CHECK_TRISTATE}`);
            type = SelectorBaseRadioCtrl.SELECTOR_RADIO_TOGGLE;    
        }
        this.child_type = type; 

        /* Set Callback */
        this.callback = new SelectorCallback();
        this.callback.add(callback);

        /* Set Direction */
        this.direction = new SelectorDirection();
        this.direction.set(direction, this.container, prioritize_container_size);

        /* Set Name */
        if (typeof name !== 'string'){
            console.error('Name needs to be a string');
            name = 'Error!';
        }
        this.name = name;

        let default_styles = {'radio_item': 'myselect_radio_item', 'radio_text': 'myselect_radio_text', 'radio_circle': 'myselect_radio_circle'};
        this.styles = new SelectorStyles();
        this.styles.set(default_styles);

        /* Set Disable */
        this.disable = false;

        /* Set Items */
        this.options = new SelectorOptions(false);

        /* saved values */
        this.selected_saved = [];
    }

    /**
     * @param {string} label
     */
    _generate_id(label){
        return `${this.name}_${label.replace('_', '-')}`;        
    }

    /* No Initial is added if initial = null */
    /**
     * @param {string[]} items
     * @param {string | null} initial
     */
    async set_items(items, initial){
        await this.options.set(items, initial);        
    }

    /**
     * @param {Function} callback
     * @param {boolean | undefined} front
     */
    add_callback(callback, front){
        this.callback.add(callback, front);
    }

    /**
     * @param {boolean} disable
     */
    callback_disable(disable){
        this.callback.set_disable(disable);
    }

    get_items(){
        return this.options.options;
    }

    get_items_count(){
        return this.options.options.length;
    }

    /**
     * @param {any} offset
     */
    get_item_by_offset(offset){
        return this.options.get_options_by_offset(offset);
    }

    /**
     * @param {string | any[] | undefined} options
     */
    set_check_options(options){
        // @ts-ignore
        this.options.set_check_options(this.container, options, true);
    }

    /**
     * @param {string | string[]} options
     */
    set_clear_options(options){
        this.options.set_check_options(this.container, options, false)
    }

    /**
     * @param {string | [string]} option
     * @param {boolean} state
     */
    set_option(option, state){
        this.options.set_check_options(this.container, option, state);
    }

    /**
     * @param {any} styles
     */
    set_styles(styles){
        this.styles.set(styles);
    }

    /**
     * @param {boolean | undefined} disable
     */
    set_disable(disable){
        // @ts-ignore
        this.disable = disable;
    }

    save(){
        // @ts-ignore
        this.selected_saved = this.get_checked();
    }

    save_and_remove(){
        // @ts-ignore
        this.selected_saved = this.get_checked();
        this.remove();
    }

    draw_and_restore(){
        this.draw();
        this.set_check_options(this.selected_saved);
    }

    remove(){
        while (this.container.lastChild){            
            this.container.lastChild.remove();
        }
    }

    draw(){
        if (this.options.length() == 0){        
            console.log(`There is no items to display`);
            this.remove();
            // @ts-ignore
            this.container.disable = true;
            return;
        }

        // @ts-ignore
        this.container.disabled = false;
        this.remove();

        for (const option of this.options.options){
            this._create_element(option);
        }

        if (this.options.initial_idx != -1){
            this.set_check_options(this.options.options[this.options.initial_idx]);
        }
    }

    hide(){
        this.direction.hide(this.container);
    }

    unhide(){
        this.direction.unhide(this.container);
        if (this.container.children.length == 0){
            this.draw();
        }
    }

    /**
     * 
     * @param {string} name 
     */

    set_name(name){
        this.name = name;
    }

    get_checked(){
        let single = (this.child_type == SelectorBaseRadioCtrl.SELECTOR_RADIO_TOGGLE) ? true : false;
        return this.options.get_selected(this.container, single);        
    }

    
    /**
     * @param {boolean} ignore
     * @param {any} convert_to_bool
     */
    get_checked_state(ignore, convert_to_bool){
        let state = this.options.get_selection_state(this.container, ignore, convert_to_bool);
        return state;
    }

    /**
     * @param {{ currentTarget: { getAttribute: (arg0: string) => any; }; }} event
     */
    async _btn_clicked(event){
        let clicked_on = event.currentTarget.getAttribute('option');        
        let selected = this.get_checked();
        await this.callback.fire(clicked_on, this.name, selected);
    }

    /**
     * @param {any} label
     */
    // @ts-ignore
    _create_element(label){
        /* Implementation by Child Class */
        console.error('Not Overriden by Child Class');
    }
}