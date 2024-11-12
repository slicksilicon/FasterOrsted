from debug import g_error, g_debug, g_defdbg, DEBUG_MODE_BOOTSTRAP
import os
import json
import inspect

###
### Provide Configuration Information to Clients
###
class MyConfig:

    DEBUG_MODE = True

    def __init__(self) -> None:
        self.myconfig_dict = {}
        try:
            g_debug('loading myconfig.....')
            filepath = os.path.join(os.environ["PROJECTPATH"], "Config", "my_config.json")
            with open(filepath) as myconfig_fp: 
                self.myconfig_dict = json.loads(myconfig_fp.read())
            
        except Exception as e:
            g_error(f'Failed to read my_config.json !!!!!. Reason = {e}')

    def get_config_str(self, key:str)->str:
        if key not in self.myconfig_dict:
            g_error(f'Key {key} is missing')
            return "Missing"

        return self.myconfig_dict[key]

    def get_config_dict(self, key:str)->dict:
        if key not in self.myconfig_dict:
            g_error(f'Key {key} is missing')
            return {}

        return self.myconfig_dict[key]

    def get_config_list(self, key:str)->list:
        if key not in self.myconfig_dict:
            g_error(f'Key {key} is missing')
            return []
        
        return self.myconfig_dict[key]
    
    def get_config_int(self, key:str)->int:
        if key not in self.myconfig_dict:
            g_error(f'Key {key} is missing')
            return -1
        
        try:
            return int(self.myconfig_dict[key])
        except: #noqa
            g_error(f'Failed to Convert {self.myconfig_dict[key]} of {key} to int')
            
        return -1

g_defdbg(DEBUG_MODE_BOOTSTRAP, f'Creating from {inspect.stack()[6].filename}')  
g_instance = MyConfig()
