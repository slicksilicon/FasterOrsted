import {SelectorBaseRadioCtrl} from "./SelectorBaseCtrl.js";
import { DivCtrl } from "./helpers.js";

export class SelectorMultipleCtrl extends SelectorBaseRadioCtrl{
    /**
     * @param {string | HTMLElement} div
     * @param {'vertical'|'horizontal'} direction
     * @param {string} name
     * @param {Function} callback
     */
    constructor(div, direction, name, callback, prioritize_container_size=true){
        let parent = DivCtrl(div, 'div');
        if (parent == null){
            console.error(`Div is not valid ${div}`);
            parent = document.createElement('div');
        }

        let multi_parent = document.createElement('div');

        parent.appendChild(multi_parent);
        super(multi_parent, direction, name, callback, SelectorBaseRadioCtrl.SELECTOR_RADIO_MULTI, prioritize_container_size);
        this.multi_parent = multi_parent;    
        this.disable = false;           
    }

    set_only_one(){
        this.add_callback(this._uncheck_others.bind(this), true);
    }

    /**
     * @param {any} clicked_on
     * @param {any} name
     * @param {string[]} selected
     */
    _uncheck_others(clicked_on, name, selected){
        this.callback_disable(true);

        let clicked_idx = selected.indexOf(clicked_on);
        if (clicked_idx >=0){
            selected.splice(clicked_idx,1);
        } 
    
        for (let select of selected){
            let idx = selected.indexOf(select);
            if (idx >= 0){
                this.set_clear_options(selected);
                selected.splice(idx,1);
            }
        }
    
        this.callback_disable(false);
    }

    /**
     * @param {string} label
     */
    _create_element(label){
        let id = `${this.name}_${label.replace('_', '-')}`
        
        let element_outer = document.createElement('div');

        let element_input = document.createElement('input');
        element_input.classList.add('form-check-input');    
        element_input.type = 'checkbox';
        element_input.name = this.name;
        element_input.id = id;        
        element_input.disabled = this.disable;
        element_input.addEventListener('click', this._btn_clicked.bind(this));
        element_input.checked = false;     
        element_input.setAttribute('option', label);

        let element_label = document.createElement('label');
        element_label.classList.add('form-check-label');        
        // element_label.classList.add(this.style_text);    
        this.styles.set_element_style(element_label, 'radio_text');
        element_label.id = id;
        element_label.innerHTML = label;

        element_outer.appendChild(element_input);
        element_outer.appendChild(element_label);        

        this.multi_parent.append(element_outer);
    }

    /**
     * 
     * @returns this returns the state of selectors which are true only
     */
    get_checked_state(){
        return SelectorBaseRadioCtrl.prototype.get_checked_state.call(this, true, true);
    }

    /**
     * 
     * @returns this returns the state of all selectors including those that are false
     */

    get_all_states(){
        return SelectorBaseRadioCtrl.prototype.get_checked_state.call(this, false, true);
    }
}