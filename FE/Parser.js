/**
 * @param {{}} reply
 * @returns {Promise<{}>}
 */
export async function ParseReply(reply){        
    let param_names = Object.keys(reply);
    for (let param_name of param_names){
        let parsed_arg = await parseItem(reply[param_name], param_name);
        /* Check if it is a single value reply without the need to encapsulate in the dict */
        if (param_names.length == 1 && param_name == 'LonelyReply'){
            return parsed_arg;
        }                

        reply[param_name] = parsed_arg;
    }    
    return reply;
}

/**
 * @param {{}} value_struct
 * @param {string} param_name
 */
async function parseItem(value_struct, param_name){    
    let value_type = '';
    try{
        value_type = Object.keys(value_struct)[0];
    }
    catch{
        console.error(`[${param_name}] value_struct is invalid = ${value_struct}`);
        return null;
    }

    return await parseValue(value_type, value_struct[value_type], param_name);
}

/**
 * @param {string} value_type
 * @param {any} value
 * @param {string} param_name
 */
async function parseValue(value_type, value, param_name){
    if (value_type.includes('TypeEnum')){
        return await parseEnumCreation(value_type, value, param_name);
    } else if (value_type == 'NoneType'){
        return null;    
    } else if (value_type.includes('Type')){
        return await parseObjCreation(value_type, value, param_name);
    } 

    switch(value_type){
        case 'int':
            return parseInt(value)
        case 'float':
            return parseFloat(value)
        case 'str':
            return value;
        case 'bool':
            return value;
        case 'list':
            return await parseList(value, param_name);
        case 'dict':
            return await parseDict(value, param_name);
        case 'BytesIO':
            return value;
        case 'bytes':
            return await parseBytes(value);
        case 'skip':
            return value;
                        
    }

    console.error(`[${param_name}] Unsupported type of ${value_type}`);

    return null;
}

/**
 * @param {string} obj_type
 * @param {any} values
 * @param {string} param_name
 */
async function parseObjCreation(obj_type, values, param_name){
    try{
        var { default : objClass } = await import (`../static/${obj_type}.js`);
        return new objClass(values);
    }
    catch(error){
        console.error(`[${param_name}] Failed to Create Object of type = ${obj_type}, Reason = ${error.message}`);
        return null;
    }
}

/**
 * @param {string} obj_type
 * @param {any} value
 * @param {string} param_name
 */
async function parseEnumCreation(obj_type, value, param_name){
    try{
        var module = await import ('../FE/TypeEnum.js')
        return new module[obj_type](value);
    } catch(error) {
        console.error(`[${param_name}] Failed to Create Enum of type = ${obj_type}, Reason = ${error.message}`);
        return null;
    }
}

/**
 * @param {[]} value
 * @param {string} param_name  
 */
async function parseList(value, param_name){
    if (Array.isArray(value) == false){
        console.log(`[param_name] type of list but actual value is not list ${typeof value}`);
        return null;
    }

    let parsed_list = [];
    for (let item of value){
        let parsed_item = await parseItem(item, param_name);
        parsed_list.push(parsed_item);        
    }

    return parsed_list;
}

/**
 * @param {{}} value
 * @param {string} param_name 
 */
async function parseDict(value, param_name){
    if (value.constructor != Object){
        console.error(`[${param_name}] type of dict but actual value is not dict ${typeof value}`);
        return null;
    }

    let parsed_dict = {};
    for (let key of Object.keys(value)){
        let parsed_item = await parseItem(value[key], param_name);
        parsed_dict[key] = parsed_item;        
    }

    return parsed_dict;
}

/**
 * @param {string} json_bytes
 */
async function parseBytes(json_bytes){
    let data = JSON.parse(json_bytes);
    return data;
}

