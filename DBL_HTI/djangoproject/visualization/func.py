import os, csv, json

def remove(path, name):
    try:
        file_path = os.path.join(path, name)
        os.remove(file_path)
        print('JSON successfully deleted')
    except:
        print('no JSON copy exists')

    name = name_ext(name, '.csv')

    try:
        file_path = os.path.join(path, name)
        os.remove(file_path)
        print('CSV successfully deleted')
    except:
        print('no CSV copy exists')

def name_ext(name, ext):
    i = 0
    for item in name:
        if item == '.':
            name = name[:i]+ext
            break
        i += 1

    return name