import { GetCtrl } from '../static/fetch.js';
import { Sleep } from './helpers.js';

globalThis.my_instance = null;

function get_instance(){
    if (globalThis.my_instance == null){        
        globalThis.my_instance = new Global();
    }

    return globalThis.my_instance;
}

/**
 * @param {string} server_address
 */
export async function global_boot(server_address){
    let obj = get_instance();
    await obj.boot();
    await obj.init_websocket(server_address);
}

/**
 * @param {string} message
 * @param {function} callback
 */
export function register_ws_callback(message, callback){
    let obj = get_instance();
    obj.register_ws_notification(message, callback);
}

/**
 * @return {Promise<string>} 
 * global boot needs to run to get the cookie from the websocket callback, so we need to do an await to release the main thread
 */
export async function get_cookie(){
    let count = 2;    
    while (count >= 0){
        let obj = get_instance();           
        if (obj.websocket_cookie == ''){
            count--;            
            await Sleep(100);
            continue
        } 
        return obj.websocket_cookie;
    }        
    
    console.error('Cookie was not found');
    return '';
}
class Global{
    constructor(){
        this.websocket = null;
        this.websocket_cookie = '';
        this.callbacks = {};
        this.HEARTBEAT_RATE = 1000;
        this.log = [];
        this.error_msg_timeout = 0;
        this.error_msg_element = document.getElementById('global_error_msg');
        if (this.error_msg_element == null){
            console.error(`Missing element = global_error_msg in base.html`)
            this.error_msg_element = document.createElement('div');
        }                
    }

    async boot(){
        let sidebar = await GetCtrl('get_sidebar_configuration', {}, true);                
        this.draw_sidebar(sidebar);        
    }

    /**
     * @param {string} server_address
     */
    init_websocket(server_address){
        this.websocket = new WebSocket(`ws://${server_address}/ws`);                
        this.websocket.addEventListener('message', this.callback_websocket.bind(this));
    }

    /**
     * @param {string} message
     * @param {function} callback     
     */
    register_ws_notification(message, callback){
        if (message in this.callbacks){
            this.callbacks[message].push(callback);
        } else {
            this.callbacks[message] = [callback]
        }
    }

    /**
     * @param {any} raw_data
     */
    _process_image(raw_data){
        let image_array = new Uint8Array(raw_data);
        let binary_string = '';   
        let image_length = raw_data.length;        
        for (let start=0;start<image_length;start=start+10000){
            let end = (start+10000<image_length) ? start+10000 : image_length;
            binary_string += String.fromCharCode.apply(null, image_array.slice(start, end));
        }        
        let base64 = btoa(binary_string);        
        let image_url = `data:image/jpg;base64, ${base64}`;

        return image_url;
    }

    /**
     * @param {MessageEvent} event
     */
    async callback_websocket(event){
        let message = JSON.parse(event.data);
        if (message.msg == 'update_cookie'){
            this.websocket_cookie = message.cookie;                        
        }

        if (!(message.msg in this.callbacks)){
            return;
        }

        if (typeof message.payload.image !== 'undefined' && typeof message.payload.image_id !== 'undefined'){
            let image = this._process_image(message.payload.image);
            let image_id = message.payload.image_id;
            for (let callback of this.callbacks[message.msg]){
                callback(image, image_id);
            }
            return;            
        }                
        
        for (let callback of this.callbacks[message.msg]){
            callback(message);
        }
        
    }

    /**
    * * @param { Object } sidebar 
    */
    draw_sidebar(sidebar) {
        let top_element = document.getElementById('global_sidebar');
        if (top_element == null){
            console.error(`Invalid base.html file, missing global_sidebar`);
            return;
        }        

        for (const [category, item_list] of Object.entries(sidebar)){
            let c_element = document.createElement('h6');
            c_element.classList.add('sidebar_category');
            c_element.innerHTML = category;

            let i_element = document.createElement('i');
            i_element.classList.add('bi');
            i_element.classList.add('bi-patch-plus');
            i_element.classList.add('category_icon');
            
            c_element.appendChild(i_element);

            let ul_element = document.createElement('ul');
            ul_element.classList.add('nav');
            ul_element.classList.add('flex-column');
            
            for(let idx=0;idx<item_list.length;idx++){
                let item = item_list[idx];
                let li_element = document.createElement('li');
                li_element.classList.add('nav-item');
                
                let a_element = document.createElement('a');
                a_element.classList.add('nav-link');
                a_element.classList.add('sidebar_item');
                if (typeof(item.subfolder) !== 'undefined'){                        
                    a_element.href = `../${item.subfolder}/${item.page}.html`;
                } else {                    
                    a_element.href = `../${item.page}.html`;
                }
                

                let ii_element = document.createElement('i');
                ii_element.classList.add('bi');
                ii_element.classList.add(item.icon);
                ii_element.classList.add('option_icon');

                a_element.appendChild(ii_element);
                a_element.innerHTML += ` ${item.name}`;

                li_element.append(a_element);

                ul_element.appendChild(li_element);
            
            }

            top_element.append(c_element);
            top_element.append(ul_element);

        }
    }
}