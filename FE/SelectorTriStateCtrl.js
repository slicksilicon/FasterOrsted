import { SelectorBaseRadioCtrl, SelectorCallback} from "./SelectorBaseCtrl.js";
import { TriState, TRISTATE_IGNORE, TRISTATE_NEGATIVE, TRISTATE_POSITIVE} from "./TypeTristate.js";

export class SelectorTriStateCtrl extends SelectorBaseRadioCtrl{
    /**
     * @param {string | HTMLElement} div
     * @param {"horizontal" | "vertical"} direction
     * @param {any} name
     * @param {Function} callback
     */
    constructor(div, direction, name, callback, prioritize_container_size=true){
        super(div, direction, name, callback, SelectorBaseRadioCtrl.SELECTOR_CHECK_TRISTATE,prioritize_container_size);
        /* Set Callback */
        this.callback = new SelectorCallback();
        this.callback.add(callback);

        this.items_state = {};

        /* Dont Change Check Box Styles */
        this.set_styles({'radio_item': null});
        this.set_styles({'radio_circle': null});        
    }

    /**
     * Sets Item, Value Used when Drawn
     * @param {string} item 
     * @param {TriState} state 
     * @returns 
     */

    set_item_state(item, state){        
        if (this.options.includes(item)){   
            this.items_state[item] = state;
        } else {
            console.error(`Item ${item} not in ${this.options.options}`);
            return;
        }        
    }
    /**
     * 
     * @returns Get States of All Items in Dictionary Format
     */
    get_checked_state(){
        return SelectorBaseRadioCtrl.prototype.get_checked_state.call(this, true, false)
    }        
        

    /**
     * @param {string} item
     */
    _get_state(item){
        if (!(item in this.items_state)){
            return TRISTATE_IGNORE;
        }

        return this.items_state[item];
    }

    /**
     * @param {any} state
     */
    _next_state(state){
        if (state == TRISTATE_POSITIVE){
            return TRISTATE_NEGATIVE;
        }

        if (state == TRISTATE_IGNORE){
            return TRISTATE_POSITIVE;
        }

        if (state == TRISTATE_NEGATIVE){
            return TRISTATE_IGNORE;
        }

        console.error(`Unknown Original State of ${state}`);
    }

    /**
     * @param {string} label
     */
    _create_element(label){
        let id = this._generate_id(label);        

        let element_outer = document.createElement('div');     
        // Not set since style is null
        this.styles.set_element_style(element_outer, 'radio_item');

        let element_input = document.createElement('input');
        element_input.classList.add('form-check-input');        
        // Not set since style is null        
        this.styles.set_element_style(element_input, 'radio_circle');

        element_input.type = 'checkbox';
        element_input.name = this.name;
        element_input.id = id;        
        element_input.disabled = this.disable;
        element_input.setAttribute('label', label)
        element_input.addEventListener('click', this._btn_tristate_handler.bind(this));

        /* Update State & Save */
        let state = this._get_state(id);
        this._set_checkbox(element_input, state);
        this.set_item_state(label, state);          

        let element_label = document.createElement('label');
        element_label.classList.add('form-check-label');        
        this.styles.set_element_style(element_label, 'radio_text');
        element_label.setAttribute('for', id);
        element_label.innerHTML = label;

        element_outer.appendChild(element_input);
        element_outer.appendChild(element_label);
        this.container.appendChild(element_outer);        
    }

    /**
     * @param {HTMLInputElement} element
     * @param {string} state
     */
    _set_checkbox(element, state){
        if (state == TRISTATE_POSITIVE){
            element.checked = true;
            element.indeterminate = false;
            return;
        }

        if (state == TRISTATE_NEGATIVE){
            element.checked = false;
            element.indeterminate = true;
            return;
        }

        if (state == TRISTATE_IGNORE){
            element.checked = false;
            element.indeterminate = false;
            return;
        }

        console.error(`Unknown State = ${state} being set to element = ${element.id}`);
    }

    /**
     * @param {{ currentTarget: HTMLInputElement; }} event
     */
    async _btn_tristate_handler(event){
        let label = event.currentTarget.getAttribute('label');
        if (label == null){
            console.error(`Failed to get lable for ${event.currentTarget}`);
            label = '';
        }        

        let state = this._get_state(label);
        state = this._next_state(state);
        this.set_item_state(label, state);

        this._set_checkbox(event.currentTarget, state);
        await this.callback.fire(label, this.name, state);     
    }
}