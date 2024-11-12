from ManagerBase import ManagerBase
from debug import g_error
import MyConfig
import ManagerCtrl

class ManagerAppConfig(ManagerBase):
    
    DEBUG_MODE = False
    VERBOSE_MODE = False

    def __init__(self, client_id) -> None:
        super().__init__(client_id)
              
    def handler_get_sidebar_configuration(self):
        sidebar = MyConfig.g_instance.get_config_dict('sidebar')
        return sidebar
    
    def handler_get_fast_cmd_list(self)->dict:
        return ManagerCtrl.g_instance.get_handler_list()
        
    def handler_get_fast_cmd_annotations(self, method:str, api_name:str)->dict:
        if method != 'GET' and method != 'POST':
            g_error(f'Unsupported method = <{method}>')
            return {}

        handlers = self.handler_get_fast_cmd_list()[method]
        if api_name not in handlers:
            g_error(f'API of <{api_name}> not in supported handlers of method <{method}>')        
            return {}
        
        sig = ManagerCtrl.g_instance.get_api_signature(method, api_name)
        if sig is None:
            return {}
        
        parameters = sig.parameters
        reply = {}
        for param_name in parameters.keys():
            annotation = parameters[param_name].annotation
            reply[param_name] = ManagerCtrl.g_instance.get_annotation_name(annotation)
        
        return reply



    
        
