import {Wait} from '../../FasterOrsted/FE/wait.js'
import {ParseReply} from '../../FasterOrsted/FE/Parser.js';


var global_wait = new Wait('global_wait_div', false);
// @ts-ignore
const CHUNK_END = 'END!'

/**
 * @param {string} cmd
 * @param {{}} data
 * @param {Boolean} wait_animation
 * @returns {Promise<[{}, string]>}
 */
async function _GetCtrl(cmd, data, wait_animation){
        /* Start Loading Animation */
        if (wait_animation == true){
            global_wait.attach();
        }
    
        let url = CreateUrl(cmd, data);
    
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers:{
                'Content-Type': 'application/json'            
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',        
        });
    
        let parsedAnswer = {};
        try{
            let answer = await response.json();
            parsedAnswer = await ParseReply(answer);
        } catch (error){
            console.log(`GET JSON Failure = ${error}`)        
        }
    
        if (wait_animation == true){
            global_wait.stop("");
        }

        let payload_encoding = response.headers.get('payload_encoding');
        if (payload_encoding == null){
            payload_encoding = '';
        }
        
        return [parsedAnswer, payload_encoding];
}

/**
 * @param {string} cmd
 * @param {{}} data
 * @param {Boolean} wait_animation
 * @returns {Promise<any>}
 */

export async function GetCtrl(cmd, data, wait_animation){
    // @ts-ignore
    let [parsedAnswer, payload_encoding] = await _GetCtrl(cmd, data, wait_animation);

    return parsedAnswer;
}

/**
 * @param {string} cmd
 * @param {{}} data
 * @param {Boolean} wait_animation
 * @returns {Promise<any>}
 */

export async function GetCtrlWithHeader(cmd, data, wait_animation){
    let [parsedAnswer, payload_encoding] = await _GetCtrl(cmd, data, wait_animation);
    
    return [parsedAnswer, payload_encoding];
}

/**
 * @param {string} cmd
 * @param {{}} data
 * @param {Boolean} wait_animation
 */
export async function PostCtrl(cmd, data, wait_animation){
    /* Start Animation */
    if (wait_animation == true){
        global_wait.attach();
    }

    let url = CreateUrl(cmd, data);

    const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        body: JSON.stringify(data)
    });

    if (wait_animation == true){
        global_wait.stop("");
    }

    let result = response.status == 200 ? true : false;

    return result;
}


/**
 * @param {string} cmd
 * @param {{}} data
 */
export function CreateUrl(cmd, data){        
    let url = `/${cmd}`;
    
    if (Object.keys(data).length == 0){        
        return url;     
    }
    
    let delimiter = '?';
    for (const[key, value] of Object.entries(data)){
        // let param = (typeof value === 'object') ? JSON.stringify(value) : value;  
        
        let param = encodeURIComponent(JSON.stringify(value));
        url += `${delimiter}${key}=${param}`;
        delimiter = '&';
    }
    
    return url;
}

export const IMAGE_ID = 'image_id'
export const IMAGE_PATH = 'fullpath'
export const IMAGE_FLAGS = 'image_flags'
export const IMAGE_FLAGS_BW = "BlackAndWhite"
export const IMAGE_FLAGS_THUMB_SIZE = "ImageResizeToThumb"

/**
 * @param {any} path
 * @param {string|null} flag
 */
export function ChangeImagePathToUrl(path, flag){
    let param = {[IMAGE_PATH]: path};
    if (flag != null){
        param[IMAGE_FLAGS] = flag;
    }

    return CreateUrl('get_image', param);
}

/**
 * @param {string} cmd
 * @param {{}} param
 */
export function ChangeImageCmdToUrl(cmd, param){
    return CreateUrl(cmd, param);
}


/**
 * @param {string} url
 * @param {string} keyword
 * @returns {string}
 */
export function DecodeKeyword(url, keyword){
    let idx = url.indexOf(keyword);
    if (idx == -1){
        return "";
    }

    idx = idx + keyword.length+1;
    let end_idx = url.indexOf('&', idx);
    if (end_idx == -1){
        end_idx = url.length;
    }

    if (end_idx == idx){
        return "";
    }

    return url.slice(idx, end_idx);

}

/**
 * @param {string | URL} url
 */
export function CheckUrlIsValid(url){
    try{
        let obj = new URL(url);
        if (obj.protocol  == 'https:' || obj.protocol == 'http:'){
            return true;
        } else {
            return false;
        }
    } catch {
        return false;
    }
}