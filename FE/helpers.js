/**
 * @param {string | HTMLElement} div
 * @param {string} tag Return Element to create if failure occurs
 */
export function DivCtrl(div, tag){
    let element = null;
    if (typeof div === 'string'){
        element = document.getElementById(div);         
    } else {
        element = div;
    }

    if ((typeof element === 'undefined') || (element == null)){
        console.trace(`Div is Invalid ${div} ==> Forcing to Tag = ${tag}`);
        return document.createElement(tag);
    }

    return element;
}

/**
 * @param {string} original
 * @param {boolean} encode
 */
export function EncodeAmpersand(original, encode){
    if (encode == true){
        return original.replace("&", "%26");
    }

    return original;
}

/**
 * @param {*} item
 * @param {string} type
 * @return {boolean}
 */
export function CheckType(item, type){
    if (typeof item === type){
        return true;
    }

    if (type == 'array'){
        if ((typeof item === 'object') && (Array.isArray(item) == true)){
            return true;
        }

        return false;
    }

    if (type == 'dict'){
        if ((typeof item === 'object') &&  (item.constructor == Object)){
            return true;
        }

        return false;
    }

    return false;

}
/**
 * @param {*} item
 * @return {'undefined'|'string'|'symbol'|'function'|'int'|'float'|'dict'|'object'|'array'|'boolean'}
 */
export function GetType(item){
    let mytype = typeof item;        

    if (item == null){
        return 'undefined';
    }

    switch(mytype){
        case 'undefined':
        case 'string':
        case 'symbol':
        case 'function':
        case 'boolean':
            return mytype;            
        case 'bigint':
            return 'int';            
        case 'number':
            if (Number.isInteger(item) == true){
                return 'int';
            } else {
                return 'float';
            }            
        case 'object':
            if (Array.isArray(item) == true){
                return 'array';
            } else if (item.constructor == Object){
                return 'dict';
            } else {
                return 'object';
            }            
        default:
            console.error(`Unsupport Type = ${mytype}`);
            return 'undefined';
        }  
}


/**
 * @param {string} value_px
 */
export function CovertPxToInt(value_px){
    return parseInt(value_px.split('px')[0]);
}


/**
 * @param {Element} element
 * @param {string} property
 */
export function GetNumAttribute(element, property){
    let value = element.getAttribute(property);
    if (value == null){
        console.error(`Failed to ${property} from ${element.id}`);
        return 0.0;
    }
    return parseFloat(value);
}

/**
 * @param {string} value
 */
function _compute_size(value){
    let splits = value.split('px');
    if (splits.length != 2){
        console.error(`Computed Value is invalid = ${value}`);
        return 0;
    }    

    let size = parseFloat(splits[0]);

    if (isNaN(size)){
        console.error(`Parsed value is invalid ${size}`);
        return 0;
    }

    return size;

}

/**
 * @param {Element} element
 */
export function GetComputedFontSize(element){
    if (!(element instanceof HTMLElement)){
        console.error(`Element is not HTMLElement = ${element}`);
        return 0;
    }
    
    let value = window.getComputedStyle(element, null).fontSize;

    return _compute_size(value);
}

/**
 * @param {Element} element
 */
export function GetComputedHeight(element){
    if(!(element instanceof HTMLElement)){
        console.error(`Element is not HTMLElement = ${element}`);
        return 0;
    }

    let value = window.getComputedStyle(element, null).height;

    return _compute_size(value);
}

/**
 * @param {Element|string} element
 */
export function GetComputedWidth(element){
    if (typeof (element) === 'string'){
        let div = document.getElementById(element);
        if (div == null){
            console.error(`Invalid id = ${element}`);
            return 0;
        }
        element = div;
    }
    
    if (!(element instanceof HTMLElement)){
        console.error(`Element is not HTMLElement = ${element}`);
        return 0;
    }

    let value = window.getComputedStyle(element, null).width;

    return _compute_size(value);
}


/* Adjust Font size till it fits the element, must be an svg element*/
/**
 * @param {HTMLElement} container
 */
export function AdjustFontSizeSvg(container){
    container.querySelectorAll('text').forEach(function(text_element){                                                
        let svg = text_element.parentElement;
        let width = text_element.getBBox().width;
        if (svg == null){
            console.log(`Failed to get parent from ${text_element}`);
            return;
        }
        
        if (svg.tagName != 'svg'){
            console.log(`Parent of Text Element Must be SVG != ${svg.tagName}`);
            return;
        }

        let viewBox = svg.getAttribute('viewBox');
        if (viewBox != null){
            let values = viewBox.split(' ');        
            if (values != null){
                let height = svg.getAttribute('height');
                values = [`0`, `0`, `${width}`, `${height}`];
            }        
            svg.setAttribute('viewBox', `${values[0]} ${values[1]} ${values[2]} ${values[3]}`);
        }
    });     
}

/**
 * 
 * @param {HTMLElement | string} container 
 * @returns {Number} size of title in container
 */
export function AdjustFontSizeHtml(container){
    let div = DivCtrl(container, 'div');

    if (div.constructor.name == 'CreateElement'){
        // @ts-ignore
        div = div.get_element();
    }

    // @ts-ignore
    if (div.tagName != 'DIV'){
        // @ts-ignore
        console.error(`Only Supports DIV and is not ${div.tagName} == DIV`);
        return 0;
    }

    // @ts-ignore
    let size = GetComputedFontSize(div);
    if (size == 0){
        console.error(`size is invalid for ${container} ==> ${div}`);
        return size;
    }
    
    // @ts-ignore
    while (div.scrollHeight > div.clientHeight || div.scrollWidth > div.clientWidth){
        size = size - 1;
        if (size < 5){
            console.debug(`Font size has hit minimum = ${div} == ${size}`);
            return size;
        }        
        // @ts-ignore
        div.style.fontSize = `${size}px`;
    }

    return size;
}


/**
 * @param {Element} svg
 * @returns {{'width': number, 'height': number}}
 */
export function getSvgSize(svg){
    return {'width': svg.clientWidth, 'height': svg.clientHeight};
}

export function getSvgPos(svg){
    let bbox = svg.getBBox();

    return {'x': bbox.x, 'y': bbox.y};
}

export function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export function getSVGNS(){
    return 'http://www.w3.org/2000/svg';
}

export function getFlag(value, flags){
    let flag = flags[value];
    if ((flag == null) || (typeof flag === 'undefined')){
        flag = false;
    }

    return flag;
}

export function ClosestSignificant(value, higher){
    let pow = Math.pow(10, Math.floor(Math.log10(value)));
    let close = (higher == true) ? Math.ceil(value/pow) : Math.floor(value/pow);

    return close * pow;    
}

export function ToTitleCase(sentence){    
    return sentence.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

export const Sleep = (/** @type {Number} */ ms) => new Promise(res => setTimeout(res, ms));

/**
 * Creates Date Object at Midnight GMT (Note Month must be Jan = 1)
 * @param {Number} year 
 * @param {Number} month
 * @param {Number} day
 * @returns {Date} A Date Object
*/
export function CreateDate(year, month, day){

    /* JSON Stringfy will remove timezone and when sending to Python in PostCtrl */
    /* Add timezone offset so that it is 0:00 GMT */ 

    // let offset = (new Date().getTimezoneOffset()) * -1;
    let offset = 0;
    let str_offset_hours = (offset / 60).toString().padStart(2, '0');
    let str_offset_minutes = (offset % 60).toString().padStart(2, '0');



    let str_m = month.toString().padStart(2,'0');
    let str_d = day.toString().padStart(2, '0');
    let iso_string = `${year}-${str_m}-${str_d}T00:00:00.000+${str_offset_hours}:${str_offset_minutes}`;   
    
    let date = new Date(iso_string);
    return date;    
}

/**
 * Corrects Time Zone to be GMT
 * @param {Date} date 
 * @returns {Date}
 */
export function CorrectDateTimeZone(date){
    // let offset = (date.getTimezoneOffset()) / 60;
    // date.setHours(-1 * offset);            
    return CreateDate(date.getFullYear(), date.getMonth()+1, date.getDate());
}

/**
 * Cretes Now Time object which set to Midnight GMT
 * @returns {Date}
 */

export function CreateNowDate(){
    let date_local = new Date(Date.now());
    return CreateDate(date_local.getFullYear(), date_local.getMonth() + 1, date_local.getDate());
}


/**
 * @param {HTMLElement} element
 * @param {number} duration_hide
 * @param {number} duration_show
 */
async function _blink_element(element, duration_hide, duration_show=0){
    element.hidden = true;
    await Sleep(duration_hide);
    element.hidden = false;
    if (duration_show != 0){
        await Sleep(duration_show);
    }
}

/**
 * Blinks element once if no error and multiple times quick if there is an error
 * @param {HTMLElement} element 
 * @param {Boolean} result 
 */

export async function BlinkMe(element, result){
    let element_blink = DivCtrl(element, 'div');    
    if (result == false){
        await _blink_element(element_blink, 100, 100);
        await _blink_element(element_blink, 100, 100);
        await _blink_element(element_blink, 100, 100);
        return;
    }

    await _blink_element(element_blink, 500, 0);
}

/**
 * Allows for the query of a parent for child using ids which contain only numbers
 * @param {HTMLElement} parent 
 * @param {any} id 
 * @returns 1st child element matching the id
 */
export function QueryParentById(parent, id){
    let qID = `[id="${id}"]`;
    return parent.querySelector(qID);
}