import { SelectorBaseRadioCtrl } from "./SelectorBaseCtrl.js";
import { DivCtrl } from "./helpers.js";

export class SelectorToggleCtrl extends SelectorBaseRadioCtrl{

    /**
     * 
     * @param {HTMLElement|string} div 
     * @param {'horizontal'|'vertical'} direction 
     * @param {string} name 
     * @param {Function} callback 
     * @param {boolean} prioritize_container_size 
     * @returns 
     */
    constructor(div, direction, name, callback, prioritize_container_size){
        // Encapsulate the elements within a div, since direction changes the parent css
        let parent = DivCtrl(div, 'div');        
        let toggle_parent = document.createElement('div'); 
        toggle_parent.style.justifyContent = 'center';       
        parent.appendChild(toggle_parent);
        
        // Call Super
        super (toggle_parent, direction, name, callback, SelectorBaseRadioCtrl.SELECTOR_RADIO_TOGGLE, prioritize_container_size);           

        // Save Class parameters
        this.checked_item = '';
        this.toggle_parent = toggle_parent;
    }

    /**
     * @param {string} item
     */
    set_checked_item(item){
        if (this.options.includes(item)){
            this.checked_item = item;
        } else {
            console.error(`Item ${item} not in ${this.options.options}`);
            return;
        }

        this.draw();
    }

    /**
     * @param {string} label
     */
    _create_element(label){
        let id = this._generate_id(label);
        let checked_id = this._generate_id(this.checked_item);

        let outer_element = document.createElement('div');

        this.styles.set_element_style(outer_element, 'radio_item');

        let element_input = document.createElement('input');
        element_input.classList.add('form-check-input');        
        this.styles.set_element_style(element_input, 'radio_circle')

        element_input.type = 'radio';
        element_input.name = this.name;
        element_input.id = id;
        element_input.checked = (id == checked_id) ? true : false;
        element_input.disabled = this.disable;
        element_input.addEventListener('click', this._btn_clicked.bind(this));

        let element_label = document.createElement('label');
        element_label.classList.add('form-check-label');        
        this.styles.set_element_style(element_label, 'radio_text');
        element_label.setAttribute('for', id);
        element_label.innerHTML = label;

        
        outer_element.appendChild(element_input);
        outer_element.appendChild(element_label);

        this.toggle_parent.append(outer_element);
    }
}