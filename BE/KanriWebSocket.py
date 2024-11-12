from debug import g_debug, g_error, g_verbose, g_defdbg, DEBUG_MODE_BOOTSTRAP

from fastapi import WebSocket
from collections.abc import Callable
import inspect
import uuid

INVALID_COOKIE = ''

class KanriWebSocket:
    
    DEBUG_MODE = True
    VERBOSE_MODE = False

    @staticmethod
    def get_cookie(websocket:WebSocket, error:bool)->str:
        try:
            return websocket.cookies["session"]
        except Exception as e:
            if error is True:
                g_error(f'Cookie is missing. Reason = {e}')
            return INVALID_COOKIE
                
    @staticmethod
    async def _send_message(msg_name, payload, websocket:WebSocket)->bool:
        try:
            cookie = KanriWebSocket.get_cookie(websocket, True)
            message = {'msg': msg_name, 'cookie': cookie, 'payload': payload}
            await websocket.send_json(message)
            return True #noqa
        except Exception as e:
            g_error(f'Failed to Send Message. Reason {e}', up_stack=1)
            return False

    def __init__(self) -> None:
        self.active_list:dict[str, WebSocket] = {}
        self.msg_callbacks:dict[str, list[Callable]] = {}
        self.connection_callbacks:list[Callable] = []

        g_debug('WebSocket Manager Created', skip_prefix=False)    

    async def connect(self, websocket:WebSocket):
        await websocket.accept()
        cookie = KanriWebSocket.get_cookie(websocket, False)
        if cookie == INVALID_COOKIE:
            cookie = str(uuid.uuid4())
            websocket.cookies['session'] = cookie

        self.active_list[cookie] = websocket
    
        g_debug(f'New Connection {cookie}')

        self.send_connection_callbacks('connect', cookie)

        await KanriWebSocket._send_message('update_cookie', 'Invalid', websocket)

    def disconnect(self, websocket: WebSocket):        
        cookie = KanriWebSocket.get_cookie(websocket, True)
        try:
            del self.active_list[cookie]
            self.send_connection_callbacks('disconnect', cookie)
        except Exception as e:
            g_error(f'Websocket with {cookie} is not in list. Reason = {e}')

    async def broadcast_message(self, msg_name:str, payload):        
        cookies = self.active_list.keys()
        for cookie in cookies:
            websocket = self.active_list[cookie]
            result = await KanriWebSocket._send_message(msg_name, payload, websocket)
            if result is False:
                self.disconnect(websocket)

    def register_for_msg(self, cookie, callback:Callable):
        if cookie in self.msg_callbacks:
            self.msg_callbacks[cookie].append(callback)
        else:
            self.msg_callbacks[cookie] = [callback]

    def register_for_connection_msg(self, callback:Callable)->bool:
        if callback in self.connection_callbacks:
            g_error('callback already registered')
            return False
        
        self.connection_callbacks.append(callback)

        return False
    
    def send_connection_callbacks(self, msg:str, cookie:str):
        for callback in self.connection_callbacks:
            callback(msg, cookie)

    async def send_message(self, msg_name:str, payload, cookie:str)->bool:        
        if cookie not in self.active_list:
            g_error(f'Cookie not valid = {cookie}')
            return False
        
        websocket = self.active_list[cookie]
        await KanriWebSocket._send_message(msg_name, payload, websocket)

        g_verbose(f'[Websocket] Msg Sent => {msg_name} {payload}')

        return True
    
    def receive_msg(self, websocket:WebSocket, msg):
        cookie = KanriWebSocket.get_cookie(websocket, True)
        if cookie not in self.active_list:
            g_error(f'Message Received from non active client = {cookie}')
            return
        
        if cookie not in self.msg_callbacks:
            g_debug(f'No client for message = {msg}')
            return
        
        for callback in self.msg_callbacks[cookie]:
            try:
                callback(msg)
            except Exception as e:
                g_error(f'Exception occured in client callback = {callback}. Reason = {e}')
                continue

        return
    
    def exists_cookie(self, cookie:str)->bool:
        return cookie in self.active_list


try: #noqa
    g_defdbg(DEBUG_MODE_BOOTSTRAP, f'Creating from {inspect.stack()[6].filename}')    
except: #noqa
    pass

g_instance = KanriWebSocket()
