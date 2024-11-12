import os
import uvicorn

from debug import g_defdbg
from IpAddress import get_ip_address
from main_parser import parse_repos_type

DEBUG_MODE = True

ENV_WORKSPACEPATH = os.environ["WORKSPACEPATH"]
# ENV_PROJECTPATH = os.environ["PROJECTPATH"]
# ENV_FASTYPATH   = os.environ["FASTYPATH"]
# ENV_IPADDRESS   = os.environ["SERVER_IPADDRESS"]
ENV_SOCKET      = os.environ["SERVER_SOCKET"]

if __name__ == '__main__':    
    ipaddress = get_ip_address()
    reload_folders = parse_repos_type(ENV_WORKSPACEPATH, True)
    g_defdbg(DEBUG_MODE, f'Starting Up Uvicorn : Socket = {ENV_SOCKET} Address = {ipaddress}')
    uvicorn.run(app="main_boot:app", reload=True, port=int(ENV_SOCKET), host=ipaddress,reload_includes=reload_folders, log_level='warning')
