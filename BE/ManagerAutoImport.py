from debug import g_debug, g_verbose
from typing import List

import os
import inspect
import re

###
### Auto Import Classes
###

class ManagerAutoImport:

    DEBUG_MODE = False
    VERBOSE_MODE = False

    def __init__(self, paths:list) -> None:
        self.prefixes = ['Type', 'Data', 'Manager']
        self.excludes = ['ManagerBase', 'ManagerCtrl']
        self.paths = paths

    def _check_valid_klass(self, klass_name:str)->bool:        
        if klass_name in self.excludes:
            return False

        found = re.findall("^[A-Z].+?(?=[A-Z])", klass_name)
        if len(found) == 0:
            return False
        
        prefix = found[0]        
        if prefix not in self.prefixes:
            return False

        return True        

    def _get_file_extension(self, filename:str)->str:
        try:
            extension = filename.split('.')[-1]
        except: #noqa
            return ''
    
        return extension

    def _get_list_of_modules(self)->List[str]:
        modules:list = []        

        for current_path in self.paths:    
            files = os.listdir(current_path)
            for file in files:
                full_path = os.path.join(current_path, file)
                if os.path.isfile(full_path) == False:
                    continue
                        
                if self._get_file_extension(file) != "py":
                    continue
                
                module_name = file.split(".py")[0]
                
                g_verbose(f'checking {module_name} ==> {self._check_valid_klass(module_name)}')

                # Is Module Excluded
                if module_name in self.excludes:
                    continue

                # Does Module have the Right Prefix
                for substr in self.prefixes:
                    if substr in module_name:
                        modules.append(module_name)

        return modules

    def AutoImport(self):
        imported_klasses = []

        module_names = self._get_list_of_modules()
        g_debug(f'Import modules = <{module_names}>')
        for module_name in module_names:        
            mod = __import__(module_name)
            klass_names = inspect.getmembers(mod, inspect.isclass)
            g_debug(f'[{module_name}] ', end='')
            for klass in klass_names:
                klass_name = klass[0]                
                if self._check_valid_klass(klass_name) is False:
                    continue

                if klass_name in imported_klasses:
                    continue

                getattr(mod, klass_name)
                imported_klasses.append(klass_name)
                g_debug(f'{klass_name} ', end='')
                
            g_debug('')
                    