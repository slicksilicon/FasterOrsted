import { DivCtrl } from "./helpers.js";

export class CreateElement{
    constructor(type, style, classes){
        /* Used to restore display after hide */
        this.display = null;

        this.type = type;
        this.element = document.createElement(type);
        if (type == 'button'){
            this.element.type = 'button';            
        }

        if (type == 'input'){
            this.element.type = 'text';
        }

        /* Add Styles */
        this._style_element(style);
        
        /* Add Classes */
        for (const class_name of classes){
            this.element.classList.add(class_name);
        }        
    }

    _style_element(style){
        for (const property in style){            
            if (typeof style[property] === 'number'){
                this.element.style[property] = `${style[property]}px`; 
                continue;
            }            
            
            this.element.style[property] = style[property];
        }
    }

    set_style(style){
        this._style_element(style);
    }

    set_id(id){
        this.element.id = id;
    }

    get_id(){
        return this.element.id;
    }

    get_height(){
        return this.element.offsetHeight;
    }

    get_width(){
        return this.element.offsetWidth;
    }

    get_element(){
        return this.element;
    }

    set_flex(flex_direction){
        this.element.style.display = 'flex';
        this.element.style.flexDirection = flex_direction;
    }

    set_size(width, height){
        if (typeof width === 'string'){
            this.element.style.width = width;
        } else if (typeof width === 'number'){
            this.element.style.width = `${width}px`;
        }

        if (typeof height === 'string'){
            this.element.style.height = height;
        } else if (typeof height === 'number'){
            this.element.style.height = `${height}px`;
        }
    }

    set_size_px(width, height){
        if (width != null){
            this.element.style.width = `${width}px`;
        }

        if (height != null){
            this.element.style.height = `${height}px`;
        }
    }

    set_size_percentage(width, height){
        if (width != null){
            this.element.style.width = `${width}%`;
        }

        if (height != null){
            this.element.style.height = `${height}%`;
        }
    }

    set_margin(margin){
        this.element.style.margin = `${margin}px`;
    }

    set_margin_tb(top, bottom){
        if (top != null){
            this.element.style.marginTop = `${top}px`;
        }

        if (bottom != null){
            this.element.style.marginBottom = `${bottom}px`;
        }
    }

    set_margin_lr(left, right){
        if (left != null){
            this.element.style.marginLeft = `${left}px`;
        }

        if (right != null){
            this.element.style.marginRight = `${right}px`;
        }
    }

    set_innerHTML(text){
        if (this.type == 'input'){
            this.element.value = text;
            return;
        }

        this.element.innerHTML = text;
    }

    get_innerHTML(){
        if (this.type == 'input'){
            return this.element.value;
        }

        return this.element.innerHTML;
    }

    set_position(type, top, left){
        this.element.style.position = type;
        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }

    set_disable(disable){
        this.element.disabled = disable;
    }

    hide(hide){
        if (hide == true && this.element.style.display != 'none'){
            this.display = this.element.style.display;
            this.element.style.display = 'none';
            return;
        }

        if (hide == false && this.element.style.display == 'none'){
            this.element.style.display = this.display;
        }

    }

    listener(callback, eventType){
        if (typeof callback !== 'function'){
            console.error(`callback must be a function = ${callback}`);
            return;
        }

        if (typeof eventType !== 'string'){
            console.error(`eventType must be defined`);
            return;
        }

        this.element.addEventListener(eventType, callback);
    }

    /**
     * @param {string | HTMLElement} container
     */
    append(container){
        let div = DivCtrl(container, 'div');
        if (div == null){
            console.error(`Invalid Div ${this.element}`);
            return;
        }

        /* If this is a CreateElement Object it will call the elements appendChild function */
        div.appendChild(this.element);
    }

    /**
     * @param {any} child
     */
    appendChild(child){
        this.element.appendChild(child);
    }

    /**
     * @param {string} existing
     * @param {string} updated
     */
    replace_class(existing, updated){
        this.element.classList.replace(existing, updated);
    }
}

export class CreateBtn{
    /**
     * @param {string} color
     * @param {string} name
     * @param {string} container_id
     * @param {{'width': number, 'height': number}} size
     * @param {function} callback
        
     }} callback
     */
    constructor(color, name, container_id, size, callback){
        let classes = ['btn', this._create_btn_class_name(color)];
        this.element = new CreateElement('button', {}, classes);
        let my_id = name.replace(' ', '_').toLowerCase();
        this.element.set_id(`${my_id}_id`);
        this.element.set_innerHTML(name);

        if (typeof size !== 'undefined'){
            this.set_size(size.width, size.height);
        }

        if (typeof container_id !== 'undefined'){
            this.append(container_id);
        }

        if (typeof callback === 'function'){
            this.listen(callback, 'click');
        }

        this.display_store = this.element.element.style.display;
        this.color = color;
    }

    _create_btn_class_name(color){
        return `btn-${color}`;
    }

    set_size(width, height){
        this.element.set_size(width, height);
    }

    set_margin(left, right, top, bottom){
        this.element.set_margin_lr(left, right);
        this.element.set_margin_tb(top, bottom);
    }

    listen(callback, eventType){
        if (typeof callback != 'function'){
            console.error(`Callback must be function not ${callback}`);
            return;
        }

        if (typeof eventType === 'undefined'){
            eventType = 'click';
        }

        this.element.listener(callback, eventType);
    }

    append(container){
        this.element.append(container);
    }

    set_disable(disable){
        this.element.set_disable(disable);
    }

    hide(hide, display=false){
        if (display == false){
            let visibility = (hide == true) ? 'hidden' : 'visible';
            this.element.element.style.visibility = visibility;
            return;
        }

        if (hide == true){
            this.display_store = (this.element.element.style.display == 'none') ? this.display_store : this.element.element.style.display;
            this.element.element.style.display = 'none';
        } else {
            this.element.element.style.display = this.display_store;
        }
    }
    
    change_text(text){
        this.element.set_innerHTML(text);
    }

    get_text(){
        return this.element.get_innerHTML();
    }

    change_color(color){
        if (this.color == color){
            return;
        }

        let existing = this._create_btn_class_name(this.color);
        let updated  = this._create_btn_class_name(color);

        this.element.replace_class(existing, updated);
        this.color = color;
    }
}

export class CreateLayout{
    /**
     * @param {string | HTMLElement} container
     * @param {{ structure: any; styles: any; classes: any; columns: any; rows: any; }} layout
     */
    constructor(container, layout){
        this.container = DivCtrl(container, 'div');
        if (this.container.style.position != 'relative' && this.container.style.position != 'absolute'){
            this.container.style.position = "relative";
            if (this.container.style.top == ''){
                this.container.style.top = "0px";                
            }

            if (this.container.style.left == ''){
                this.container.style.left = '0px';
            }
        }
        
        /******************/
        /** Parse Layout **/
        /******************/        

        /* Total Container Size */
        this.height = 0;
        this.width = 0;
        this._size_container();

        /* Get List of Ids */
        this.ids = this._parse_ids(layout.structure);

        /* Parse Styles / Classes */
        this.styles = layout.styles;
        this.classes = layout.classes;
        if (typeof this.styles === 'undefined'){
            this.styles = {};
        }

        if (typeof this.classes === 'undefined'){
            this.classes = {};
        }

        this.margins = this._calc_margins();

        /* Size */
        this.columns_intepreted = this._intepret_layout(layout.columns);
        this.rows_intepreted = this._intepret_layout(layout.rows);

        /* Calculate Column & Rows */
        this.columns_size = this._calc_line_size(this.columns_intepreted, this.width);
        this.rows_size = this._calc_line_size(this.rows_intepreted, this.height);

        /* Elements */        
        this.structure = this._parse_structure(layout.structure);
        this.elements = this._create_elements();

        this._set_element_dimensions();

        this.container.addEventListener('resize', this.callback_container_resize.bind(this));
    }

    draw(){
        for (let id in this.elements){
            this.elements[id].append(this.container);
        }
    }

    _size_container(){
        this.height = this.container.clientHeight;
        this.width = this.container.clientWidth;
    }

    _intepret_layout(layout){
        let intepreted = {'fixed': 0, 'percentage': 0, 'fill': false, 'lines': layout};

        for (const line of layout){
            if (line.type == 'fixed'){
                intepreted.fixed += line.value;
                continue;
            }

            if (line.type == 'percentage'){
                intepreted.percentage += line.value;
                continue;
            }

            if (line.type == 'fill'){
                if (intepreted.fill == true){
                    console.error(`More than one fill exists in ${layout}`);
                    continue;
                }

                intepreted.fill = true;
                continue;
            } 
            
            console.error(`Unknown sizing type of ${line.type}`);
        }    

        if (intepreted.fill == true && intepreted.percentage == 100){
            console.warn(`Interpreted has fill but percentage is also 100 = ${intepreted}`);
        }
        
        return intepreted;
    }

    _calc_line_size(intepreted, total_size){
        let lines = [];
        let percentage_size = total_size - intepreted.fixed;
        let fill_size = total_size - (percentage_size * intepreted.percentage / 100) - intepreted.fixed;        
        let fixed_ratio = 1;

        /* Check Layout */
        if (intepreted.percentage != 0 && percentage_size <= 0){
            console.warn(`Fixed Size consumes whole of layout Container = ${total_size} Fixed = ${intepreted.fixed}`);
            percentage_size = 0;
        }

        if (intepreted.fixed == true && fill_size <= 0){
            console.warn(`Fixed & Percentage Size consumes whole of layout Container = ${total_size} Fixed = ${intepreted.fixed}, fill will be empty`);
            fill_size = 0;
        }

        if (intepreted.fixed > total_size){
            console.warn(`Fixed Size ${intepreted.fixed} > Total Size ${total_size}`);
            fixed_ratio = intepreted.fixed / total_size;
        }

        /* Calc Line Sizes */
        for (const line of intepreted.lines){
            if (line.type == 'fixed'){
                lines.push(line.value * fixed_ratio);
                continue;
            }

            if (line.type == 'percentage'){
                lines.push(line.value / 100 * percentage_size);
                continue;
            }

            if (line.type == 'fill'){
                lines.push(fill_size);
                continue;
            }

            console.error(`Unimplemented type = ${line.type}`);
        }

        return lines;
    }

    _override_margin(id, property){
        let value = (property in this.styles[id]) ? this.styles[id][property] : ('margin' in this.styles[id]) ? this.styles[id]['margin'] : 0;

        return value;
    }

    _calc_margins(){
        let margins = {}
        for (let id of this.ids){
            let margin = {'top': 0, 'bottom': 0, 'left': 0, 'right':0};
            /* No Style to Consider */
            if (!(id in this.styles)){
                margins[id] = margin;
                continue;
            }

            /* has Style, Priority Invididual Values */
            margin.top = this._override_margin(id, 'marginTop');
            margin.bottom = this._override_margin(id, 'marginBottom');
            margin.left = this._override_margin(id, 'marginLeft');
            margin.right = this._override_margin(id, 'marginRight');

            margins[id] = margin;
        }

        return margins;
    }
    

    /**
     * @param {any} structure
     */
    _parse_ids(structure){
        let ids = [];
        for (const line of structure){
            for (const id of line){
                if (!(ids.includes(id)))
                    ids.push(id);
                }
            }
        return ids;
    }

    _parse_structure(structure){
        let parsed = {}
        let row = 0;
        for (const line of structure){
            let column = 0;
            for (const cell of line){                
                if (!(cell in parsed)){
                    parsed[cell] = [];
                }
                parsed[cell].push(`R${row}C${column}`);
                column = column + 1;
            }

            
            row = row + 1;
        }

        return parsed;
    }

    _create_elements(){
        let elements = {}
        for (const id in this.structure){
            let style = (id in this.styles) ? this.styles[id] : {};
            let classes = (id in this.classes) ? this.classes[id] : [];
            let element = new CreateElement('div',style, classes);
            element.set_id(id);
            elements[id] = element;
        }

        return elements;
    }

    _parse_reference(reference){
        let results = {};
        results.row = parseInt(reference.match(/(?<=R)[0-9]*/i)[0]);
        results.column = parseInt(reference.match(/(?<=C)[0-9]*/i));

        return results;
    }

    _set_position(reference, id){
        let ref = this._parse_reference(reference);

       let top = 0;
       while(ref.row > 0 ){
        top += this.rows_size[ref.row-1];
        ref.row -= 1;
       }

       let left = 0;
       while(ref.column > 0){
        left += this.columns_size[ref.column-1];
        ref.column -= 1;
       }

       /* Correct for margins */
       top = top + this.margins[id].top;
       left = left + this.margins[id].left;
       this.elements[id].set_position('absolute', top, left);
    }

    _set_size(references, id){        
        let start = this._parse_reference(references[0]);
        let end = this._parse_reference(references[references.length-1]);

        let height = 0;
        for (let row=start.row;row<=end.row;row++){
            height += this.rows_size[row];
        }

        let width = 0;
        for (let column=start.column;column<=end.column;column++){
            
            width += this.columns_size[column];
        }

        /* correct for Margins */
        height = height - this.margins[id].top - this.margins[id].bottom;
        width = width - this.margins[id].left - this.margins[id].right;

        this.elements[id].set_size_px(width, height);        
    }

    _set_element_dimensions(){
        for (const id in this.structure){
            this._set_position(this.structure[id][0], id);
            this._set_size(this.structure[id], id);
        }
    }

    callback_container_resize(){
        /* New Container Size */
        this._size_container();

        /* Recalculate Size of Each Line */
        this.columns_size = this._calc_line_size(this.columns_intepreted, this.width);
        this.rows_size = this._calc_line_size(this.rows_intepreted, this.height);

        /* Update Element Position and Size */
        this._set_element_dimensions()
    }
}
