from debug import g_defdbg, g_error
import re

def _re_operation(sentence:str, pattern:str, func:str, debug:bool, error:str)->str:
    match = re.search(pattern, sentence)
    if match is None:
        g_error(f'[{func}] Failed to find in {sentence}', up_stack=3)
        return error
    
    found = match.group(1)

    g_defdbg(debug, f'[{func}] Found #{found}# from {sentence}', up_stack=3) 

    return found
        
def re_capture_till(sentence:str, till:str, debug:bool)->str:
    pattern = f"^(.*?)\\{till}.*"
    return _re_operation(sentence, pattern, f'Capture Till=<({till})>', debug, sentence)

def re_capture_between(sentence:str, start:str, end:str, debug:bool)->str:
    pattern = f"\\{start}([^\\{start}]*)\\{end}"
    return _re_operation(sentence, pattern, f'Capture Between=<({start} & {end})>', debug, sentence)





