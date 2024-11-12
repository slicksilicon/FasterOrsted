import { GetCtrl, PostCtrl } from "../static/fetch.js";
import { SelectorDropDownCtrl } from "../static/SelectorDropDownCtrl.js";
import { CreateBtn } from "./CreateElement.js";
import { GetType, ToTitleCase } from "./helpers.js";
import { InputArray, InputDictionary, InputSimple } from '../static/Inputs.js'

/***********/
/* Globals */
/***********/

var g_inputs = {};

/***************************************/
/* Get All API's Available from Server */
/***************************************/
var commands = await GetCtrl('get_fast_cmd_list', {}, true);


/*********************************/
/* Method Selections GET or POST */
/*********************************/

var select_method = new SelectorDropDownCtrl('select_method_id', 'select_method', 'Select Method', callback_select_method, true, true, 300, null);
select_method.draw(Object.keys(commands), null);

async function callback_select_method(){
    let selected = select_method.get_selected();
    select_cmd.draw(commands[selected], null);
}

/*****************/
/* API Selection */
/*****************/

var select_cmd = new SelectorDropDownCtrl('select_command_id', 'select_cmd', 'Select Command', callback_select_cmd, true, true, 300, null);
select_cmd.draw([], null);

async function callback_select_cmd(){
    let selected = select_cmd.get_selected();
    let parameters = await GetCtrl('get_fast_cmd_annotations', {'method': select_method.get_selected(), 'api_name': selected}, true);

    let panel = document.getElementById('parameters_input_id');
    if (panel == null){
        return;
    }

    parameters_draw(parameters);

    btn_execute.set_disable(false);
}
/*******************/
/* Execute Command */
/*******************/

var btn_execute = new CreateBtn('danger', 'Execute Command', 'btn_execute_id', 300, callback_execute_api);
btn_execute.set_disable(true);

async function callback_execute_api(){
    let method = select_method.get_selected();
    let cmd = select_cmd.get_selected();
    let parameters = await parameters_read();

    if (method == 'POST'){
        // @ts-ignore
        let result = await PostCtrl(cmd, parameters, true);
        let panel = document.getElementById('reply_id');
        if (panel == null){
            return;
        }

        panel.style.fontSize = '200px';
        panel.innerHTML = ToTitleCase(`${result}`);
        return;
    }

    if (method == 'GET'){
        // @ts-ignore
        let result = await GetCtrl(cmd, parameters, true);
        let panel = document.getElementById('reply_id');
        if (panel == null){
            return;
        }

        panel.style.fontSize = '24px';
        panel.innerHTML = pretty_print(result);
        return;

    }
}
/*************************/
/* Parameters Management */
/*************************/

/**
 * @param {{}} parameters
 */
async function parameters_draw(parameters){
    let parent = document.getElementById('parameters_input_id');
    if (parent == null){
        console.error(`failed to find parent = parameters_input_id`);
        return;
    }

    while(parent.children.length > 0){
        parent.removeChild(parent.children[0]);
    }

    g_inputs = {};

    let param_names = Object.keys(parameters);
    for (let param_name of param_names){
        let value_type = parameters[param_name];
        let label = `${param_name} <b>${value_type}</b>`;

        if (value_type == 'int' || value_type == 'str' || value_type == 'float'){
            let input = new InputSimple('parameters_input_id', label, value_type)
            g_inputs[param_name] = input;
            continue;
        }

        let type_substring = value_type.substring(0,4);

        if (type_substring == 'list'){
            let input = new InputArray('parameters_input_id', label);
            g_inputs[param_name] = input;
            continue;
        }

        if (type_substring == 'dict'){
            let input = new InputDictionary('parameters_input_id', label, true);
            g_inputs[param_name] = input;
            continue;
        }

        if (type_substring == 'Type'){
            try{
                var { default : objClass } = await import (`../static/${value_type}.js`);                                 
            } catch {
                console.error(`Could not Import ${value_type}`);
                continue;
            }

            let structure = objClass.get_structure();
            let params = Object.keys(structure);

            let input = new InputDictionary('parameters_input_id', label, false);
            for (let param of params){
                input.add_input(param);
            }

            g_inputs[param_name] = input;
            continue;
        }
    }
}

function parameters_read(){
    let parameters = {}
    for (let param of Object.keys(g_inputs)){
        parameters[param] = g_inputs[param].read();
    }

    return parameters;
}

/****************/
/* Pretty Print */
/****************/

/**
 * @param {any} object
 */
function pretty_print(object){
    let formatted = _generate_pretty_print(object);
    return '<!DOCTYPE html> <html> <body> <p>' + formatted + '</p> </body> </html>';
}

/**
 * @param {any} object
 */
function _generate_pretty_print(object){    
    if (GetType(object) == 'dict'){
        let pretty = '{<br>';        
        let keys = Object.keys(object);
        for (let key of keys){
            pretty = pretty + `&emsp;` + `<b>${key}</b>` + ` : ${_generate_pretty_print(object[key])}` + ',<br>';        
        }

        pretty = pretty + "}";

        return pretty;
    }

    if (GetType(object) == 'array'){
        let pretty = '[ ';
        for (let item of object){
            if (pretty != '[ '){
                pretty = pretty + ', ';
            }
            pretty = pretty + _generate_pretty_print(item);
        }

        pretty = pretty + ']';

        return pretty;
    }

    if (typeof object === 'string'){
        return object;
    }

    if (typeof object == 'number'){
        return String(object);
    }

    return JSON.stringify(object);
}    
    
