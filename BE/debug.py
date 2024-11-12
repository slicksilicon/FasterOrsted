import inspect
import time

COLOR_BLACK         = '\033[30m'
COLOR_RED           = '\033[31m'
COLOR_GREEN         = '\033[32m'
COLOR_YELLOW        = '\033[33m'
COLOR_BLUE          = '\033[34m'
COLOR_MAGENTA       = '\033[35m'
COLOR_CYAN          = '\033[36m'
COLOR_LIGHT_GREY    = '\033[37m'
COLOR_DARK_GREY     = '\033[90m'
COLOR_LIGHT_RED     = '\033[91m'
COLOR_LIGHT_GREEN   = '\033[92m'
COLOR_LIGHT_YELLOW  = '\033[93m'
COLOR_LIGHT_BLUE    = '\033[94m'
COLOR_LIGHT_MAGENTA = '\033[95m'
COLOR_LIGHT_CYAN    = '\033[96m'
COLOR_WHITE         = '\033[97m'
COLOR_BOLD          = '\033[1m'
COLOR_UNDERLINE     = '\033[4m'
COLOR_NO_UNDERLINE  = '\033[24m'
COLOR_NEGATIVE      = '\033[7m'
COLOR_POSITIVE      = '\033[27m'
COLOR_DEFAULT       = '\033[0m'

DEBUG_MODE_BOOTSTRAP = False

def g_trace_stack()->None:
    output:str = ""
    try:
        (frame, filename, line_number, function_name, lines, index) = inspect.stack()[1]
        splits = filename.split('\\')
        splits = splits[-1].split(".")
        output += f"[{splits[0]}::{function_name}] "
        
        (frame, filename, line_number, function_name, lines, index) = inspect.stack()[2]
        output += f" Called by {function_name}"
    except: #noqa
        pass
    
    print(output) #noqa

def _process_color(my_text:str, color)->str:
    flag = False
    new_string = ''
    for idx in range(len(my_text)):
        if my_text[idx] == '<':
            new_string = new_string + COLOR_YELLOW
            flag = True
            continue
        
        if my_text[idx] == '#' and flag is False:
            new_string = new_string + COLOR_LIGHT_BLUE
            flag = True
            continue

        if my_text[idx] == '>' or (my_text[idx] == '#' and flag is True):
            new_string = new_string + color
            flag = False
            continue

        new_string = new_string + my_text[idx]

    return new_string


def _process_info(info, color)->str:
    s = info if isinstance(info, str) else f'{info}'

    s = _process_color(s, color)

    return s
    
def _gprint(info, color, frame, end=None, skip=False):
    info = _process_info(info, color)

    if skip is False:    
        output = ""            
        try:   
            filename, line_number, function_name, lines, index = inspect.getframeinfo(frame)   
            
            
            splits = filename.split('\\')
            splits = splits[-1].split(".")
            
            source = f"[{splits[0]}::{function_name}]"
            output += f'{time.time()%100:5.3} + {source:50} '
                                               
        except Exception as e:
            print(f'gprint exception = {inspect.getframeinfo(frame)}. Reason {e}') #noqa            
        
        output += info
    else:
        output = info
        
    if end is None:
        print(color+output+COLOR_WHITE) #noqa
    else:
        print(color+output+COLOR_WHITE, end=end) #noqa
    
def g_debug(info,end=None, skip_prefix:bool=True)->None:    
    frame = inspect.currentframe()
    if frame is not None:
        frame = frame.f_back
    
    if frame is None:
        print('g_debug stack is invalid') #noqa
        return
    
    try:
        caller_class = frame.f_locals['self']    
        if caller_class.DEBUG_MODE is False:        
            return
    except: #noqa
        try:
            caller_local = frame.f_locals['debug_mode']
            if caller_local is False:
                return
        except: #noqa
            pass
    
    _gprint(info, '\033[92m', frame, end, skip_prefix)

def g_defdbg(flag:bool,info,up_stack:int=1, end=None,skip_prefix:bool=False)->None:
    if flag is False:
        return
    
    frame = inspect.currentframe()    
    while up_stack > 0 and frame is not None:
        frame = frame.f_back        
        up_stack = up_stack - 1
        
    _gprint(info, '\033[92m', frame, end, skip_prefix)
    
def g_verbose(info, end=None)->None:    
    frame = inspect.currentframe()
    if frame is not None:
        frame = frame.f_back
    
    if frame is None:
        print('g_verbose stack is invalid') #noqa
        return
    
    try:
        caller_class = frame.f_locals['self']
        if caller_class.VERBOSE_MODE is False:
            return
    except: #noqa
        try:
            caller_local = frame.f_locals['verbose_mode']
            if caller_local is False:
                return
        except: #noqa
            pass
            
    _gprint(info, '\033[95m', frame, end)
    
def g_print(info, end=None)->None:
    frame = inspect.currentframe()
    if frame is not None:
        frame = frame.f_back
    
    if frame is None:
        print('g_verbose stack is invalid') #noqa
        return
    
    caller_class = frame.f_locals['self']
    if caller_class.DEBUG_MODE is False:
        return
        
    _gprint(info, '\033[92m', frame, end, True)
    
def g_error(info, up_stack:int=1)->None:        
    frame = inspect.currentframe()    
    while up_stack > 0 and frame is not None:
        frame = frame.f_back        
        up_stack = up_stack - 1

    if frame is None:
        print('g_error stack in invalid') #noqa
        return    
    
    _gprint(info, '\033[91m', frame)

def g_errorif(condition, info, up_stack:int=1)->None:
    if condition is False or condition is None:
        g_error(info, up_stack+1)
