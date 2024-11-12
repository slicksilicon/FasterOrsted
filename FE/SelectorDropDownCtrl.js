// @ts-ignore
import {GetCtrl} from './fetch.js';
import {DivCtrl, GetType} from './helpers.js';
import {SelectorCallback, SelectorOptions, SelectorSize} from './SelectorBaseCtrl.js'


// @ts-ignore
import sheet from '../static/widget.css' with { type: 'css'}
if (!document.adoptedStyleSheets.includes(sheet)){
    document.adoptedStyleSheets.push(sheet);
}

/* constants */
const default_spacing = 5;

export class SelectorDropDownCtrl{
    /**
     * Set Lable to null if no label is needed
     * width is only applicable if vertical format
     * @param {HTMLElement|String} div 
     * @param {String} name 
     * @param {String} label 
     * @param {Function} callback 
     * @param {Boolean} default_option 
     * @param {Boolean} vertical 
     * @param {number|null} width 
     * @param {number|null} height
     * @returns 
     */
    constructor(div, name, label, callback, default_option, vertical, width, height){
        /* Get Parent Div */
        this.parent = DivCtrl(div, 'div');
        if (this.parent.constructor.name === 'CreateElement'){
            // @ts-ignore
            this.parent = this.parent.get_element();
        }
        
        /* User Settings */
        this.options = new SelectorOptions(default_option);
        this.label = label;      
                
        let label_display = (this.label == null) ? false : true;                
        this.size = new SelectorSize(this.parent, vertical, label_display, width, height)
                                      
        this.callbacks = new SelectorCallback();
        this.callbacks.set_fire_async();
        if (callback != null){
            this.callbacks.add(callback);
        }

        /* Operation Values */
        this.name = name;        

        this.div_outer = null;
        this.div_label = null;
        this.div_input = null;

        /* Restore Value After Drawing */
        this.restore_selection = false;

        /* Next Settings */
        this.next_selector = null;
        this.next_cmd = null;
        this.next_param = null;
        this.next_param_additional = null;

        this._create_element();
    }
    
    /**
     * No Initial is added if initial = null 
     * @param {Array|Object} items 
     * @param {*} initial 
     */
    async set_items(items, initial){
        // @ts-ignore
        await this.options.set(items, initial);                
    }

    /**
     * @param {string} option
     */
    async add_item(option){
        // @ts-ignore
        this.options.add_option(option);
        await this.draw();

    }

    /**
     * @param {string} initial
     */
    set_initial(initial){
        // @ts-ignore
        this.options.initial(initial);
    }

    /**
     * @param {boolean} restore
     */
    set_restore_selection(restore){
        this.restore_selection = restore;
    }
    
    /**
     * 
     * @param {Array|Object|null} items 
     * @param {*} initial 
     */
    async draw(items = null, initial=null){
        let current = null;
        if (this.restore_selection){
            current = this.get_selected();
        }

        if (items != null){
            await this.set_items(items, initial);
        } else {
            // @ts-ignore
            this.options.initial(initial);
        }
        
        this._create_items();
        // @ts-ignore
        this.dropdown.disabled = false;

        if (current != null){
            this.set_selected(current);
        }
    }

    async draw_till_select(items = null, initial){
        if (items != null){
            this.set_items(items, initial);
        } else {
            // @ts-ignore
            this.options.initial(initial);
        }
               
        this._create_items();
        // @ts-ignore
        this.dropdown.disabled = false;
        
        /* Wait for Selection to continue */        
        await this._wait_selection();
        
        let selected = this.get_selected();

        return selected;
    }

    is_valid(){
        if (this.get_selected() == null){
            return false;
        }

        return true;
    }

    /* Generic Interface for all Widgets (used by Editor) */
    get_value(){
        // @ts-ignore
        return  this.options.get_selected(this.dropdown, true);
    }

    /* Generic Interface for all Widgets (used by Editor) */
    set_value(select){
        this.set_selected(select);
    }

    /**
     * 
     * @returns {string}
     */
    get_selected(){
        // @ts-ignore
        return this.options.get_selected(this.dropdown, true);
    }

    /**
     * @param {string} select
     */
    set_selected(select){        
        // @ts-ignore
        for (let idx=0;idx<this.dropdown.children.length;idx++){
            // @ts-ignore
            if (this.dropdown.children[idx].innerHTML == select){
                // @ts-ignore
                this.dropdown.selectedIndex = idx;
                break;
            }
        }
    }

    reset_to_initial(){
        // @ts-ignore
        for (let idx=0;idx<this.dropdown.children.length;idx++){
            // @ts-ignore
            let option = this.dropdown.children[idx].innerHTML;
            // @ts-ignore
            if (this.options.is_initial(option)){
                // @ts-ignore
                this.dropdown.selectedIndex = idx;
                return;
            }            
        }
    }

    add_callback(callback, front=false){
        // @ts-ignore
        this.callbacks.add(callback, front);        
    }

    _convert_to_number(value, parent_size){
        if (typeof value === 'undefined'){
            return null;
        }

        if (typeof value === 'string'){
            if (value.endsWith('%') == true){
                let percentage = parseFloat(value);
                return (percentage / 100 * parent_size);
            }

            if (value.endsWith('px') == true){
                return parseFloat(value);
            }
        }

        return value;
    }

    // @ts-ignore
    set_size(width, height, fontsize){
        console.error(`Not Supported!!!!`);
        return;

        // this.width = this._convert_to_number(width, this.parent.clientWidth);
        // this.height = this._convert_to_number(height, this.clientHeight);
        // this.fontsize = this._convert_to_number(fontsize, 24);

        // this._set_element_size();
    }

    // @ts-ignore
    set_margin_lr(left, right){
        console.error(`Not Supported`);
        return;

        // if (left >= 0){
        //     this.div_outer.style.marginLeft = `${left}px`;
        // }

        // if (right >= 0){
        //     this.div_outer.style.marginRight = `${right}px`;
        // }
    }

    set_name(name){
        this.name = name;
    }

    get_name(){
        return this.name;
    }

    set_disable(disabled){
        // @ts-ignore
        this.dropdown.disabled = disabled;
    }

    /**
     * Will automatically call selector when self selection changes
     * @param {SelectorDropDownCtrl} selector 
     * @param {string} cmd 
     * @param {string} param_name
     * @param {function} param_additional
     */

    set_next_selector(selector, cmd, param_name, param_additional){
        this.next_selector = selector;
        this.next_cmd = cmd;
        this.next_param_name = param_name;
        this.next_param_additional = param_additional;
    }

    _set_element_size(){
        console.error(`Not Supported`);
        return;

        // if (this.height != null){
        //     this.dropdown.style.height = `${this.height}px`;        
        // }

        // if (this.width != null){
        //     this.dropdown.style.width = `${this.width}px`;
        //     this.div_label.style.width = `${this.width}px`;
        // }
        
        // this._adjust_font_size();

    }

    _adjust_font_size(){
        // @ts-ignore
        this.dropdown.removeAttribute('font-size');
        // @ts-ignore
        if (this.fontsize != null){
            // @ts-ignore
            this.dropdown.fontSize = this.fontsize;
        }

        
        // @ts-ignore
        while (this.dropdown.scrollHeight > this.dropdown.clientHeight || this.dropdown.scrollWidth > this.dropdown.clientWidth){
            // @ts-ignore
            let value = parseInt(window.getComputedStyle(this.dropdown).fontSize.split('px')[0]);
            if (value < 6){
                break;
            }            
            value = value - 1;            
            // @ts-ignore
            this.dropdown.style.fontSize = `${value}px`;

        }
    }

    _create_element(){
        // @ts-ignore
        this.div_outer = this.size.get_div_outer();
        this.div_outer.append(this.parent);

        if (this.label != null){
            // @ts-ignore
            this.div_label = this.size.get_div_title(this.label, this.div_outer);            
        }

        // @ts-ignore
        this.div_input = this.size.get_div_input(this.div_outer);                      

        this._create_dropdown();
    }

    _create_dropdown(){
        this.dropdown = document.createElement('select');
        this.dropdown.disabled = true;
      
        this.dropdown.addEventListener('change', this._callback_selected.bind(this));

        // @ts-ignore
        let input_size = this.size.get_size_input();
        this.dropdown.style.height = `${input_size.height}px`;
        this.dropdown.style.width  = `${input_size.width}px`;
        this.dropdown.style.fontSize = `${input_size.fontSize}px`;

        // @ts-ignore
        this.div_input.get_element().appendChild(this.dropdown);
    }

    _create_items(){
        // @ts-ignore
        while (this.dropdown.lastChild) {
            // @ts-ignore
            this.dropdown.removeChild(this.dropdown.lastChild);
        }

        // @ts-ignore
        let length = this.options.length();
        if (length == 0){
            return;
        }

        for (let idx=0;idx<length;idx++){
            // @ts-ignore
            let item = this.options.get_options_by_offset(idx);
            
            let element = document.createElement('option');            
            element.classList.add('dpselector');
            element.innerHTML = item;
            // @ts-ignore
            if (this.options.is_initial(item)){
                element.selected = true;
            }

            // @ts-ignore
            this.dropdown.appendChild(element);
        }

        // this._set_element_size();
        this._adjust_font_size()

        this.parent.disabled = false;
        this.parent.dispatchEvent(new Event('change'));
    }

    _wait_selection(){
        let dropdown = this.dropdown;        
        return new Promise(resolve => {            
            // @ts-ignore
            dropdown.addEventListener('change', function firstChange(){
                // @ts-ignore
                dropdown.removeEventListener('change', firstChange);                                
                // @ts-ignore
                resolve();                   
            });            
        });        
    }

    /**
     * return {string|string[]}
     */
    async _callback_selected(){    
        let selected = this.get_selected();
        // @ts-ignore
        this.callbacks.fire(selected);    

        /* Call Next Selector if one is setup */
        this._next_fire(selected);

    }

    /**
     * @param {string} selected
     */
    _next_fire(selected){
        if (this.next_selector == null || this.next_cmd == null){
            return;
        }

        let request = {'cmd': this.next_cmd};
        
        let param = {};
        if (typeof this.next_param_name === 'string'){            
            param[this.next_param_name] = selected;            
        }

        if (typeof this.next_param_additional === 'function'){
            let additional_param = this.next_param_additional();
            if (GetType(additional_param) == 'dict' && Object.keys(additional_param).length > 0){            
                param = Object.assign(param, additional_param);
            }        
        }

        if (Object.keys(param).length > 0){
            request.param = param;
        }

        this.next_selector.draw(request);
    }
}

export class SelectorSequencer{
    constructor(selectors, spacing=default_spacing){
        if (Array.isArray(selectors) == false){
            console.trace(`selector param is not an array`);
            // @ts-ignore
            return null;
        }

        /* Copy Selectors */
        this.selectors = selectors;

        /* Reset Loop Control */
        this.current_focus = -1;

        for (let idx=0;idx<this.selectors.length;idx++){
            let selector = this.selectors[idx];
            if ((selector instanceof SelectorDropDownCtrl) == false){
                console.error(`Selector List idx=${idx} is not SelectorDropDownCtrl Class`);
                continue;
            }

            /* Setup Selector */
            selector.set_disable(true);
            selector.set_name(idx);
            selector.add_callback(this._selection_callback.bind(this));

            /* set spacing */
            if (spacing > 0){
                if (idx == 0){
                    selector.set_margin_lr(0, spacing);
                } else if (idx == (this.selectors.length-1)){
                    selector.set_margin_lr(spacing, 0);
                } else {
                    selector.set_margin_lr(spacing, spacing);
                }
            }
        }

        
        
    }
    async start(){
        this._loop_selectors(0, null);
    }

    async _loop_selectors(start, selection){
        if (start == this.current_focus){
            return;
        }

        // @ts-ignore
        if (start >= this.selectors.length){
            this.current_focus = -1;
            return;
        }

        /* Disable All Selectors After Start Point */
        // @ts-ignore
        for (let idx=start+1;idx<this.selectors.length;idx++){
            // @ts-ignore
            this.selectors[idx].set_disable(true);
        }

        /* Reset Focus Point */
        this.current_focus = start;

        /* Check if Finished */
        // @ts-ignore
        if (this.current_focus == this.selectors.length){
            this.current_focus = -1;
            return;
        }

        // @ts-ignore
        let selector = this.selectors[this.current_focus];
        

        if (selection != null){
            let param = {'selection': selection}
            selector.set_options_param(param);            
        }

        /* Wait for Selection */
        selection = await selector.start_till_select();

        /* After selected, callback will be called 
           which will trigger this function again  */       
    }
    
    async _selection_callback(selection, selector){        
        let idx = selector.get_name();
        if (idx == null){
            console.error(`name of selector returned is null`);
            return;
        }

        this._loop_selectors(idx+1, selection);
    }
}