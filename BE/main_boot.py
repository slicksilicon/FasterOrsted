from debug import g_error, g_defdbg

from fastapi import FastAPI, Request, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from jinja2 import Environment, FileSystemLoader
from IpAddress import get_ip_address

import os
import sys
import MyConfig

import KanriWebSocket
import ManagerCtrl
from main_parser import parse_repos, parse_repos_type

g_defdbg(False, 'Booting Up FastAPI')

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="muzaffar") #noqa

###
### Read Args
###

ENV_WORKSPACEPATH   = os.environ["WORKSPACEPATH"]
ENV_PROJECTPATH     = os.environ["PROJECTPATH"]
ENV_SOCKET          = os.environ["SERVER_SOCKET"]

REPO_PATHS = parse_repos(ENV_WORKSPACEPATH)
for repo in REPO_PATHS:
    be_path = os.path.join(repo, 'BE')
    fe_path = os.path.join(repo, 'FE')
    sys.path.append(repo)
    sys.path.append(be_path)
    sys.path.append(fe_path)

###
### Global Const
###
 
ERROR_NO_ERROR          = 200
ERROR_NO_CLIENT         = 400 
ERROR_PARAM_WRONG       = 401
ERROR_NO_SUCH_PAGE      = 404
ERROR_OTHERS            = 406
ERROR_SERVER_PROBLEM    = 500

response_code_message = {
    ERROR_NO_ERROR      : 'Success',
    ERROR_NO_CLIENT     : 'No Such Client',
    ERROR_PARAM_WRONG   : 'Wrong Parameters',
    ERROR_NO_SUCH_PAGE  : 'No Such Page',
    ERROR_OTHERS        : 'Other Errors',
    ERROR_SERVER_PROBLEM: 'Server Problem'
}

extension_to_media_type = {
    'jpg'   : 'image/jpeg',
    'jpeg'  : 'image/jpeg',
    'png'   : 'image/png',
    'gif'   : 'image/gif',
    'avif'  : 'image/avif',
    'js'   : 'text/javascript',
    'css'  : 'text/css',
    'html' : 'text/html'
}

###
### Debug Settings
###

DBG_COMMAND_OPERATION = False
DBG_WEBSOCKET_OPERATION = True
DBG_FILE_REQUEST_OPERATION = False

###
### Load Project Configuration
###

config_app_title:str = MyConfig.g_instance.get_config_str('title')
config_nav_title:str = MyConfig.g_instance.get_config_str('nav_title')

###
### Support Functions
###

def _get_file_extension(filename:str, suppress_error:bool=False)->str:
    try:
        extension = filename.split('.')[-1]
    except: #noqa
        if suppress_error is False:            
            g_error(f'No File Extension in {filename}')

        return ''
    
    extension = extension.replace('/', '')

    return extension
    

def _parse_file_locations(folders:list[str], extensions:list)->dict:
    locations = {}
    for folder in folders:
        for file in os.listdir(folder):
            extension = _get_file_extension(file)
            if extension in extensions:
                locations[file] = folder
    
    return locations

def _check_media_type(filename:str)->str:
    media_type = 'text/plain'
    extension = _get_file_extension(filename)
    try:
        media_type = extension_to_media_type[extension]
    except: #noqa
        g_error(f'[Media Type]Fatal Error Unsupported Extension {extension}')        

    return media_type


###
### Global Variables
###

# Front End Variables
g_frontend_file_types       = ['html', 'css', 'js', '.jpg', '.png', '.ico']
g_frontend_folders = parse_repos_type(ENV_WORKSPACEPATH, False)
g_backend_folders  = parse_repos_type(ENV_WORKSPACEPATH, True)
g_frontend_file_locations   = _parse_file_locations(g_frontend_folders, g_frontend_file_types) 
g_server_address = f'{get_ip_address()}:{ENV_SOCKET}'

# Init ManagerCtrl 
ManagerCtrl.g_instance.set_paths(g_backend_folders)

###
### File Response Helpers
###

# Gets a clean filename without path or other decorators
def _clean_filename(filepath:str)->str:
    if filepath[-1] == '/':
        filepath = filepath[:-1]
    
    count = filepath.count('/')
    while count > 1:
        filepath = filepath.split('/')[-1]
        count = filepath.count('/')
    
    filepath = filepath.replace('/', '')

    return filepath

# Decides if the file needs Jinja to generate the HTML from template or just reply with the file
def _manage_frontend_files(filename:str, ext:str, param:dict)->FileResponse | HTMLResponse | JSONResponse: #noqa
    filename_cleaned = _clean_filename(filename)
    if ext == 'html':
        return _render_jinja_file(filename_cleaned)
    
    return _create_file_response(filename_cleaned)

# Reply to the request with the requested File
def _create_file_response(filename:str)->FileResponse | JSONResponse:    
    if filename not in g_frontend_file_locations:
        message = f'ERROR : {filename} missing from location dict'
        g_error(message)
        return JSONResponse(content=message, status_code=404)
    
    fullpath = os.path.join(g_frontend_file_locations[filename], filename)

    media_type = _check_media_type(filename)

    g_defdbg(DBG_FILE_REQUEST_OPERATION, f'Filename = {filename} media_type={media_type} path={fullpath}')

    return FileResponse(path=fullpath, filename=filename, media_type=media_type)

# Jinja Generates the HTML file via the templates and provides a HTMLResponse
def _render_jinja_file(filename:str)->HTMLResponse | JSONResponse:
    try:
        env = Environment(loader=FileSystemLoader(g_frontend_folders), autoescape=True)
        template = env.get_template(filename)

        media_type = _check_media_type(filename)

        rendered = template.render(title=config_app_title, nav_title=config_nav_title, serverip=g_server_address)
        response = HTMLResponse(content=rendered, status_code=200, media_type=media_type)

    except Exception as e:
        message = f'Failed to render {filename}. Error = {e}'
        g_error(message)
        response = JSONResponse(content=message,status_code=404)

    return response
   
###
### Routers
###


# Before & After Support via middleware
@app.middleware('http')
async def middleware(request: Request, call_next)->Response:
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    return response

# Error Handlers
@app.exception_handler(404)
def not_found(request: Request, exc : HTTPException): #noqa
    return _render_jinja_file('error.html')

##
## Routers - Fixed Files
## 

@app.get("/favicon.ico")
async def favicon() -> FileResponse:
    filename = 'favicon.png'
    fullpath = os.path.join(ENV_PROJECTPATH, "BE", filename)
    media_type = _check_media_type(filename)
    return FileResponse(path=fullpath, filename=filename, media_type=media_type)        

@app.get('/frontpage.png')
def frontpage() -> FileResponse:
    filename    = 'frontpage.png'
    fullpath    = os.path.join(ENV_PROJECTPATH, "BE", filename)
    media_type  = _check_media_type(filename) 
    return FileResponse(path=fullpath, filename=filename, media_type=media_type) 


@app.get('/')
def index(request:Request)->RedirectResponse:    #noqa
    url_redirect = f'http://{g_server_address}/Index.html'
    return RedirectResponse(url=url_redirect, status_code=302)
    
##
## Routers - Variable Files
## 

@app.get('/get_stream{_:path}', response_class=Response, responses={200: {"content": {"application/octet-stream": {}}}})
def command_handler_streaming(request: Request):
    g_defdbg(DBG_COMMAND_OPERATION, 'streaming command')
    return command_handler(request)

@app.get('/{_:path}/')
@app.post('/{_:path}/')
def command_handler(request: Request):
    param  = request.query_params._dict
    command:str = request.url.path
    method:str = request.method

    g_defdbg(DBG_COMMAND_OPERATION, f'method={method} cmd={command} param={param}')

    file_extension = _get_file_extension(command)

    if file_extension in g_frontend_file_types:
        return _manage_frontend_files(command, file_extension, param)
                    
    command = command.replace('/', '')
    reply = ManagerCtrl.g_instance.reply_handler(method, command, param)

    return reply

@app.websocket("/ws")
async def websocket_handler(websocket:WebSocket):
    await KanriWebSocket.g_instance.connect(websocket)
    g_defdbg(DBG_WEBSOCKET_OPERATION, f'Websocket connected [{websocket.cookies["session"]}]')

    # Loop Through To Receive Messages
    while True:
        try:
            data = await websocket.receive_text()
            KanriWebSocket.g_instance.receive_msg(websocket, data)
            g_defdbg(DBG_WEBSOCKET_OPERATION, f'Websocket Message = {data}')
        except WebSocketDisconnect:
            KanriWebSocket.g_instance.disconnect(websocket)
            g_defdbg(DBG_WEBSOCKET_OPERATION, 'Websocket Disconnected')
            break
