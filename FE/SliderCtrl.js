import { DivCtrl } from "./helpers.js";
import { SelectorCallback } from "./SelectorBaseCtrl.js";

export class SliderCtrl{

    /**
     * @param {string | HTMLElement} parent
     * @param {number} value_min
     * @param {number} value_max
     * @param {number} initial 
     * @param {string} title
     * @param {'vertical'|'horizontal'} direction
     * @param {boolean} draw
     * @param {Function|null} callback
     * @param {number} decimal_points
     */
    constructor(parent, value_min, value_max, initial, title, direction, draw, callback, decimal_points){
        this.parent = DivCtrl(parent, 'div');
        if (value_max <= value_min){
            console.error(`min & max vlaues inverted ==> min = ${value_min} max = ${value_max}`);                        
        }

        this.value_min = value_min;
        this.value_max = value_max;    

        if (typeof decimal_points === 'undefined'){
            this.decimal_points = value_max > 100 ? 0 : value_max > 10 ? 1 : value_max > 1 ? 2 : 3;
        } else {
            this.decimal_points = decimal_points;
        }
         

        this.value = initial;        
        this.title = title;
        this.direction = direction;

        /* Create Elements */
        this.outer_div = document.createElement('div');
        this.title_div = document.createElement('div');
        this.inner_div = document.createElement('div');        
        this.slider_element = document.createElement('input');
        this.value_div = document.createElement('div');

        /* Set Callback Client */
        this.callback = new SelectorCallback();
        this.callback.add(callback, false);
        this.callback.set_fire_async()

        /* Set Callbacks */
        this.slider_element.oninput = this._callback_input.bind(this);
        
        /* Setup Element Styling */
        this._setup_elements();

        /* Create Structure */
        this.inner_div.append(this.slider_element);
        this.inner_div.append(this.value_div);
        this.outer_div.append(this.title_div);
        this.outer_div.append(this.inner_div); 
        



        if (draw == true){
            this.draw();
        }
    };

    _update_slider_element_value(){
        this.slider_element.value = String(((this.value - this.value_min) / (this.value_max - this.value_min)) * 100);        
        this._update_displayed_value();
    }

    _update_displayed_value(){
        this.value_div.innerHTML = this.value.toFixed(this.decimal_points);
    }

    _setup_elements(){
        /* Setup outer div */
        this.outer_div.style.display = 'flex';
        
        this.outer_div.style.flexDirection = (this.direction == 'vertical') ? 'column' : 'row';
        
        this.outer_div.style.alignItems = 'center';
        this.outer_div.style.width = '100%';
        this.outer_div.style.justifyContent = 'space-between'

        /* Setup inner div */
        this.inner_div.style.display = 'flex';
        this.inner_div.style.flexDirection = 'row'; 
        this.inner_div.style.justifyContent = 'flex-start';
        if (this.direction == 'vertical'){            
            this.inner_div.style.width = 'calc(100% - 20px)';
            this.inner_div.style.paddingLeft = '10px';
        }
        

        /* Setup Title */
        this.title_div.style.fontSize = '24px';
        this.title_div.style.fontWeight = '600';
        this.title_div.style.paddingBottom = '5px';
        this.title_div.innerHTML = this.title;
        
        /* Forces the calculation & display for the current Value */
        this.value_div.style.width = '80px';
        this.value_div.style.textAlign = 'right';
        this._update_slider_element_value();

        /* Setup slider */
        this.slider_element.type = 'range';
        this.slider_element.min = '0';
        this.slider_element.max = '100';
        
        this.slider_element.classList.add('form-range');               
    }

    _callback_input(){
        let value = (parseInt(this.slider_element.value)/ 100) * (this.value_max - this.value_min) + this.value_min;                
        this.value = value;
        this._update_displayed_value();
                    
        this.callback.fire(this.title, value);                
    }

    _callback_drag_start(){
        console.log('drag start')
        this.dragging = true;
    }

    _callback_drag_end(){
        console.log('drag end')
        this.dragging = false;
    }

    /**
     * @param {string} base
     * @param {string} hover
     */

    set_color(base, hover){
        this.clr_base = base;
        this.clr_hover = hover;

        this._setup_elements();
    };

    /**
     * @param {number} value_min
     * @param {number} value_max
     * @param {number} value
     */
    set_range(value_min, value_max, value){
        this.value_min = value_min;
        this.value_max = value_max;
        this.value = value;
        this._update_slider_element_value();
    }

    draw(){
        this.parent.appendChild(this.outer_div);
    }

    get_value(){
        return this.value;
    }
}
