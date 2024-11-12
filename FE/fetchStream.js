import {Wait} from '../static/wait.js';
import { CreateUrl } from './fetch.js';

const META_DELIMITER = 45;
const META_DELIMITER_START = [60,83,84,65,82,84,62]
const META_DELIMITER_END   = [60,69,78,68,62]

var DEBUG_MODE = false;

var global_wait = new Wait('global_wait_div', false);

/**
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @return {Promise<Uint8Array|null>} 
 */
async function _read_data(reader){
    let data = await reader.read();
    if (data.done == true){
        return null;
    }

    if (typeof data.value === 'undefined'){
        return await _read_data(reader);
    }

    return data.value;
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {number[]} delimiter
 */
function _find_delimiter(data, offset, delimiter){
    let pos = 0;
    while(pos != delimiter.length){
        if (data[offset] == delimiter[pos]){
            pos++;
        }
        offset=offset+1;
    }

    return offset;
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 */
function _read_data_metadata(data, offset){
    let meta = '';
    let offset_start = _find_delimiter(data, offset, META_DELIMITER_START);
    let offset_end   = _find_delimiter(data, offset_start, META_DELIMITER_END);
    let offset_meta_end = offset_end - META_DELIMITER_END.length;

    for (let pos=offset_start;pos<offset_meta_end;pos++){
        meta += String.fromCharCode(data[pos]);
    }

    return {'meta' : meta, 'offset': offset_end};
}

/**
 * @param {Uint8Array} data
 * @param {number} shiftby
 */
function _shift_array(data, shiftby){
    let start_position = data.byteOffset + shiftby;
    let total_buffer_size = data.buffer.byteLength;
    let new_buffer_size = total_buffer_size - start_position

    let data_shifted = new_buffer_size > 0 ? new Uint8Array(data.buffer, start_position, new_buffer_size) : new Uint8Array();

    return data_shifted;
}

/**
 * @param {Uint8Array} data
 */
function _convert_string_to_int(data){
            
    let meta_size = _read_data_metadata(data, 0);
    let meta_image_id = _read_data_metadata(data, meta_size.offset);
    
    let data_shifted = _shift_array(data, meta_image_id.offset);    
    return {'size': parseInt(meta_size.meta), 'image_id': meta_image_id.meta, 'data': data_shifted};

}

/**
 * @param {Uint8Array} data
 * @param {string} name
 * @param {string} additional
 */
function _LogArray(data, name, additional){
    if (DEBUG_MODE == false){
        return;
    }

    console.log(`[${name}] ByteLength : ${data.byteLength} ByteOffset : ${data.byteOffset} First Data : ${data[0]} [Buffer] ByteLength : ${data.buffer.byteLength} | ${additional}`);
}

/**
 * @param {string} cmd
 * @param {{}} data
 * @param {CallableFunction} callback_image_loaded
 * @param {boolean} wait_animation
 * @param {any} private_data
 */
// @ts-ignore
export async function GetStream(cmd, data, callback_image_loaded, wait_animation, private_data){
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

    if (response.body == null){
        console.error('Response is None');
        return;
    }
    
    
    const reader = response.body.getReader(); 

    let chunk = new Uint8Array();
    let image = new Uint8Array();    
    let image_size = 0;
    let image_id = ''; 
    let image_idx = 0;   
    
    while(true){             
        if (chunk.byteLength == 0){
            // @ts-ignore
            chunk = await _read_data(reader);
            if (chunk == null){
                _LogArray(image, 'FINISHED', '');
                break;
            }    
        }

        _LogArray(chunk, 'Chunk Read', '');
        
        if (image_size == 0){
            let calculated = _convert_string_to_int(chunk);
            chunk = calculated.data;
            image_size = calculated.size;            
            image_id = calculated.image_id;

            _LogArray(chunk, 'Chunk Shifted', `{'size': ${chunk.byteLength}, 'offset' : ${chunk.byteOffset}}`); 
            _LogArray(image, 'Image Size', `{'image_idx' : ${image_idx} 'image_size' : ${image_size}} 'image_id: ${image_id}`);
        }
        
        let incomplete = image_size - image.byteLength;

        _LogArray(chunk, 'Pending', `{'image_complete' : ${image.byteLength} 'incomplete' : ${incomplete}}`);

        if (incomplete > chunk.byteLength){            
            image = new Uint8Array([...image, ...chunk]);            
            chunk = new Uint8Array();            
            continue;
        }

        
        let copy = new Uint8Array(chunk.buffer, chunk.byteOffset, incomplete);
        image = new Uint8Array([...image, ...copy]);
                
        let binary_string = '';           
        for (let start=0;start<image.byteLength;start=start+10000){
            let end = (start+10000<image.byteLength) ? start+10000 : image.byteLength;
            binary_string += String.fromCharCode.apply(null, image.slice(start, end));
        }                
        let image_url = `data:image/jpg;base64, ${binary_string}`;

        await callback_image_loaded(image_url, image_id, private_data);

        image_idx++;
        image_size = 0;

        chunk = _shift_array(chunk, incomplete)
        image = new Uint8Array();

        _LogArray(chunk, 'Continuing', '')
    }

    if (wait_animation == true){
        global_wait.stop("");
    }
}

function test(){
    
    /* TEST */
    let JUNK_ARRAY = [];
    for (let i=0;i<100;i++){
        JUNK_ARRAY.push(i);
    }
    let JUNK = new Uint8Array(JUNK_ARRAY);
    let JUNK2 = new Uint8Array(JUNK.buffer, 25, 75);        
    let JUNK3 = new Uint8Array(JUNK2.buffer, JUNK2.byteOffset+25, 50);

    _LogArray(JUNK, 'JUNK', '');
    _LogArray(JUNK2, 'JUNK2', '');
    _LogArray(JUNK3, 'JUNK3', '');
    

    return;
}