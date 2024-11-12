from debug import g_defdbg, g_error
import subprocess
import platform
import os


def get_ip_address()->str:
    my_system = platform.system()
    if my_system == 'Linux':
        ipaddress = _get_linux_ip_address()
    else:
        ipaddress = _get_windows_ip_address()

    g_defdbg(True, f'System = {my_system} IP Address = {ipaddress}')

    return ipaddress

def get_server_ip_address()->str:
    # return _get_windows_ip_address() #noqa
    return '127.0.0.1'

def _get_linux_ip_address()->str:
    ethernet = 'eth'
    ifconfig = subprocess.run(f"ifconfig | grep -A1 {ethernet} | grep -oP '\\binet\\s\\K\\S+'", shell=True, stdout=subprocess.PIPE, check=False)
    # ipconfig = subprocess.run(['ip', 'addr'], stdout=subprocess.PIPE) #noqa
    output = str(ifconfig.stdout)
    ipaddress = output.replace("b", '').replace('\\n','').replace("'","")

    if ipaddress == '':
        g_error(f'Failed to find IP Address for ethernet = {ethernet}. Setting IP Address = 127.0.0.1')
        return '127.0.0.1'

    g_defdbg(True, f'Linux Address = {ipaddress}')

    # return ipaddress #noqa
    return '127.0.0.1'
    

def _get_windows_ip_address()->str:
    try:
        return os.environ["SERVER_IPADDRESS"]
    except Exception as e:
        g_error(f'Windows Platform but SERVER_IPADDRESS not set. Reason {e}')
        return 'localhost'
