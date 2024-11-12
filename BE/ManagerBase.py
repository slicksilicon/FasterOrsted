from debug import g_defdbg

class ManagerBase:  
      
    DEBUG_MODE = False
        
    @staticmethod    
    def get_manager_classes()->list:
        managers = ManagerBase.__subclasses__()
        
        g_defdbg(ManagerBase.DEBUG_MODE, managers)
        
        return managers
    
    @staticmethod
    def get_handler_list()->dict:
        managers = ManagerBase.__subclasses__()        
        handler_get = {}
        handler_post = {}
        for manager in managers:
            methods = dir(manager)            
            for method in methods:
                if "handler_get_" in method:
                    get = method.split("handler_")[-1]
                    handler_get[get] = manager
                    continue
                
                if "handler_post_" in method:
                    post = method.split("handler_")[-1]
                    handler_post[post] = manager
        
        g_defdbg(ManagerBase.DEBUG_MODE, handler_get)
        g_defdbg(ManagerBase.DEBUG_MODE, handler_post)
        
        return {'GET': handler_get, 'POST':handler_post}
    
    def __init__(self, client_id) -> None:
        self.client_id = client_id
