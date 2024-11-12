from debug import g_debug, g_error, g_verbose, g_defdbg, DEBUG_MODE_BOOTSTRAP
from ManagerBase import ManagerBase
from ManagerAutoImport import ManagerAutoImport
from MyModel import MyModel
from enum import StrEnum

from fastapi.responses import Response, FileResponse
from pydantic import BaseModel
from typing import TypeVar
from collections.abc import Callable

from inspect import signature, Signature
from helpers import re_capture_till, re_capture_between

import inspect
import json
import re
import sys

API_TYPE = TypeVar('API_TYPE')

class ManagerCtrl:
        
    DEBUG_MODE = False
    VERBOSE_MODE = False
                
    def __init__(self): #noqa
        self.pydantic_list:list = []
        self.manager_list:list =  []
        self.handlers:dict = {}
        self.client:dict = {}

    def set_paths(self, paths:list[str]):
        g_defdbg(DEBUG_MODE_BOOTSTRAP, f'Creating from {inspect.stack()[1].filename}') 
        # Auto Import All Major Modules
        auto_import = ManagerAutoImport(paths)
        auto_import.AutoImport()

        models = BaseModel.__subclasses__()
        for model in models:
            if 'fastapi' in model.__module__:
                continue
                        
            self.pydantic_list.append(model)

        models = MyModel.__subclasses__()
        for model in models:
            self.pydantic_list.append(model)

        self.manager_list = ManagerBase.get_manager_classes()
        self.handlers = ManagerBase.get_handler_list() 

        self.client = self._create_new_client()


    def get_handler_list(self)->dict:
        methods = ['GET', 'POST']
        apis = {}
        for method in methods:
            handlers = self.handlers[method]
            apis[method] = []
            for handler in handlers:
                apis[method].append(handler)
        
        return apis
    
    def get_api_signature(self, method:str, api_name:str)->None|Signature:
        try:
            manager = self.client[self.handlers[method][api_name]]
            func_name = "handler_" + api_name
            func = getattr(manager, func_name)
        except Exception as e:
            g_error(f'Failed to method={method} api={api_name} function. Reason = {e}')
            return None

        return signature(func)
    
    def _process_subclasses(self, subclasses)->str:
        klasses = subclasses.split(',')
        processed = ''
        for klass in klasses:
            klass.replace(' ','')
            path = klass.split('.')
            if len(path) == 2: #noqa
                klass = path[1] #noqa
            
            if processed != '':
                processed = processed + ", "
            
            processed = processed + klass

        return processed
        
    

    def get_annotation_name(self, annotation)->str:
        type_name = f'{type(annotation)}'
        class_name = f'{annotation}'
        # Builtin Type Single Layer
        if type_name == "<class 'type'>":
            klass = re_capture_between(class_name, "'", "'", ManagerCtrl.VERBOSE_MODE)
            return klass          
        
        # Builtin Type Dual Layer
        if type_name ==  "<class 'types.GenericAlias'>":
            main_class = re_capture_till(class_name, '[', ManagerCtrl.VERBOSE_MODE)
            sub_classes = re_capture_between(class_name, "[", "]", ManagerCtrl.VERBOSE_MODE)                          
            sub_classes = self._process_subclasses(sub_classes)

            return f'{main_class}[{sub_classes}]'       
            
        # Pydantic Type
        module_klass = re_capture_between(class_name, "'", "'", ManagerCtrl.VERBOSE_MODE)
        klass = self._process_subclasses(module_klass)
        
        return klass

    def _create_new_client(self)->dict:
        # Create Manager Objects
        obj_info = {}
        for cls in self.manager_list:
            obj_info[cls] = cls(0)                
                
        return obj_info
    
    def _check_for_TypeEnum(self, annotation:str, param): #noqa
        if re.search("^(TypeEnum)", annotation) is None:
            return param
        
        if isinstance(param, dict):
            return param
        
        return {'value': param}
    
    def _get_annotation_class(self, annotation):
        raw_str = f'{annotation}'
        if 'class' in raw_str:
            return annotation
        
        if re.search('^(list)', raw_str) is not None:
            return list
        
        if re.search('^(dict)', raw_str) is not None:
            return dict
        
        if re.search('^(<enum)', raw_str) is not None:
            return 'enum'
        
        g_error(f'Unknown class type for {raw_str}')

        return annotation

    def _get_annotation_subclass(self, class_name, annotation):
        raw_str = f'{annotation}' 

        # Check annotation has only class ==> <class 'classname'>       
        only_class = re.search('(<class )', raw_str)
        if only_class is not None:
            return None                

        # Check that main class name is the same as requested 
        if class_name not in raw_str:
            g_error(f'Class Name {class_name} not in signature {raw_str}')
            return None

        # Get only the subclass
        subclass = raw_str.replace(class_name, '').replace('[', '').replace(']', '')

        # Check if has 2 subclasses (example for dictionaries)
        splits = subclass.split(',')
        if len(splits) == 2: #noqa
            subclass = splits[1].replace(' ','')

        # Split Module and Class
        splits = subclass.split('.')
        if len(splits) == 1:
            # Only Class no Module
            return eval(subclass) #noqa
                
        return getattr(sys.modules[splits[0]], splits[1])
    
    def _create_reply_element(self, obj)->dict:        
        # List
        if type(obj).__name__ == 'list':       
            reply_element = []     
            for item in obj:
                create_element = self._create_reply_element(item)
                reply_element.append(create_element)
            
            return {'list' : reply_element}

        # Dictionary
        if type(obj).__name__ == 'dict':
            reply_element = {}
            for param_name, param_value in obj.items():
                created_value = self._create_reply_element(param_value)
                reply_element[param_name] = created_value
            
            return {'dict' : reply_element}

        # Other Types
        if 'TypeEnum' in type(obj).__name__:
            reply_element = {type(obj).__name__: obj.value}
            return reply_element
        
        # Response Type
        if type(obj).__name__ == 'BytesIO':
            return {type(obj).__name__: json.load(obj)}

        if issubclass(type(obj), StrEnum) is True:
            reply_value = obj.value
            return {type(reply_value).__name__: reply_value}    
        
        return {type(obj).__name__: obj}        
    
    ###
    ### Process Incoming API Request Parameters
    ###
    
    def _process_api_request_args_dejson(self, req_args:dict)->dict|None:
        data = {}
        for param_name in req_args:
            data[param_name] = req_args[param_name].replace("'", '"')
            try:
                data[param_name] = json.loads(data[param_name])    
            except Exception as e:
                g_error(f'JSON Loads Failed on {data[param_name]} with error = {e}')
                return None
            
        return data
    
    def _process_api_request_args_default(self, func_parameter):
        if func_parameter.default is not func_parameter.empty:
            return func_parameter.default

        g_error(f'Default is missing for annotation = {func_parameter}')
        return None                  
    
    def _process_api_request_args_enum(self, annotation:Callable, req_param):
        try:
            value = annotation(req_param)
        except Exception as e:
            g_error(f'Failed to convert param value = {req_param} to {annotation.__name__}. Reason {e}')
            return None

        return value

    
    def _process_api_request_args_pydantic(self, annotation:Callable, req_param):
        # This will convert enum parameters from str to {'value': str}
        req_param = self._check_for_TypeEnum(annotation.__name__, req_param)    
        
        if not isinstance(req_param, dict):
            g_error(f'Data for Pydantic Class = {annotation} needs to be in a dict and not {type(req_param)}')
            return None
        
        try:
            processed = annotation(**req_param)            
        except Exception as e:
            g_error(f'Failed to {annotation.__name__} with {req_param} ==> {e}')
            return None
        
        return processed
    
    def _process_api_request_args_list(self, annotation, data:list)->list|None:
        if isinstance(data, list) is False:
            g_error(f'Annotation == {annotation}  but data is of type {type(data)}')
            return None                                    
        
        
        # Get Subclass if it is defined
        # If Subclass cannot be extracted there is nothing to be done further
        subclass = self._get_annotation_subclass('list', annotation)
        if subclass is None:
            return data
    
        processed_list:list = []
        for data_item in data:
            processed_item = self._process_api_args_types(subclass, data_item)
            if processed_item is None:
                g_error(f'Failed to process {data_item} of type = {type(data_item)}')
                return None
            
            processed_list.append(processed_item)

        return processed_list

    def _process_api_request_args_dict(self, annotation, data:dict)->dict|None:
        if isinstance(data, dict) is False:
            g_error(f'Annotation = {annotation} but data is of type {type(data)}')
            return None
        
        subclass = self._get_annotation_subclass('dict', annotation)
        if subclass is None:
            return data
        
        processed_dict:dict = {}
        for key in data:
            processed_value = self._process_api_args_types(subclass, data[key])
            if processed_value is None:
                g_error(f'Failed to process {data[key]} of type{type(data[key])}')
                return None
            
            processed_dict[key] = processed_value
        
        return processed_dict
            
    def _process_api_request_args_single(self, func_parameters, param_name:str, req_args):
        if param_name not in req_args:
            return self._process_api_request_args_default(func_parameters[param_name])

        annotation = func_parameters[param_name].annotation
        
        return self._process_api_args_types(annotation, req_args[param_name])
        
    def _process_api_args_types(self, annotation, req_arg):            
        class_name = self._get_annotation_class(annotation)
        if class_name is list:
            return self._process_api_request_args_list(annotation, req_arg)
        
        if class_name is dict:
            return self._process_api_request_args_dict(annotation, req_arg)        
        
        if class_name == 'enum':
            return self._process_api_request_args_enum(annotation, req_arg)
        
        if class_name in self.pydantic_list:
            return self._process_api_request_args_pydantic(annotation, req_arg)


        try:
            processed = annotation(req_arg)            
        except Exception as e:
            g_error(f'Failed to Covert with {annotation.__name__} with {req_arg} ==> {e}')
            return None
        
        return processed
        
    def _process_api_request_args(self, func:Callable, req_args:dict)->None|dict:
        kwargs = {}
        req_args_dejson = self._process_api_request_args_dejson(req_args)
        if req_args_dejson is None:
            g_error(f'Failed to desjon ={req_args}')
            return None
        
        function_parameters = signature(func).parameters        
        for param_name in function_parameters:            
            value = self._process_api_request_args_single(function_parameters, param_name, req_args_dejson)
            if value is None:
                g_error(f'[{param_name}] Failed to process {param_name} from {req_args_dejson}')
                return None
            
            g_verbose(f'{param_name} = {value}')
            
            kwargs[param_name] = value

        return kwargs

    def reply_handler(self, method:str, command:str, req_args:dict)->dict|Response:
        g_verbose(f'Command : {command}, Method : {method}, param = {req_args}')

        if command not in self.handlers[method]:
            g_error(f'command {command} not found in {method} handlers')
            return Response(None, 500) 
        
        # Get the function to call
        manager = self.client[self.handlers[method][command]]
        func_name = "handler_" + command
        func = getattr(manager, func_name)            

        # Process Arguments
        kwargs = self._process_api_request_args(func, req_args)
        if kwargs is None:        
            g_error(f'Arg processing failed for {command} with {req_args}')
            return Response(None, 500)
            
        # Call Function
        objs = func(**kwargs)
        if isinstance(objs, (Response, FileResponse)): #noqa - slows down code operation
            g_debug(f'[Command] = {command} param = {req_args} reply = {objs}')
            return objs
        
        if not isinstance(objs, dict):
            objs = {'LonelyReply': objs}
                
        reply = {}
        for key, obj in objs.items():            
            reply[key] = self._create_reply_element(obj)

        g_debug(f'[Command] = {command} param = {req_args} reply = {reply}')
 
        return reply

# Create Global Instance
g_defdbg(DEBUG_MODE_BOOTSTRAP, f'Creating from {inspect.stack()[6].filename}')  
g_instance = ManagerCtrl()
