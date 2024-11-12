import os
from debug import g_error

def parse_repos(workspace_path:str)->list[str]:    
    repo_path = os.path.join(workspace_path, 'Repos')
    if os.path.exists(repo_path) is False:
        g_error('[Repos] folder missing from Workspace')
        return []
        
    
    return [f.path for f in os.scandir(repo_path) if f.is_dir]

def parse_repos_type(workspace_path:str, backend:bool)->list[str]:
    if backend is True:
        folder = "BE"
    else:
        folder = "FE"

    repos_type = []
    repos = parse_repos(workspace_path)
    for repo in repos:
        fe_path = os.path.join(repo, folder)
        if not os.path.exists(fe_path):
            continue
        if len(os.listdir(fe_path)) == 0:
            continue

        repos_type.append(fe_path)
    
    return repos_type        


def parse_files(workspace_path:str, fe_ext:list[str], be_ext:list[str])->list[str]:
    repo_types = []
    if len(fe_ext) > 0:
        repo_types.append(False)
    
    if len(be_ext) > 0:
        repo_types.append(True)

    files = []
    find_extensions = fe_ext + be_ext
    for repo_type in repo_types:
        folders = parse_repos_type(workspace_path, repo_type)
        for folder in folders:
            files = os.listdir(folder)
            for file in files:
                filename, extension = os.path.splitext(file)
                if extension in find_extensions:
                    files.append(file)
    
    return files




        
