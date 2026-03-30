import sys

def count_tokens(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    counts = {
        '{': 0, '}': 0,
        '(': 0, ')': 0,
        '[': 0, ']': 0,
        '<': 0, '>': 0
    }
    
    in_string = False
    quote_char = ''
    in_comment = False
    comment_type = '' # 'single' or 'multi'
    
    i = 0
    while i < len(content):
        c = content[i]
        
        if in_comment:
            if comment_type == 'single' and c == '\n':
                in_comment = False
            elif comment_type == 'multi' and c == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
                i += 1
        elif in_string:
            if c == quote_char and (i == 0 or content[i-1] != '\\'):
                in_string = False
        else:
            if c == '/' and i + 1 < len(content):
                if content[i+1] == '/':
                    in_comment = True
                    comment_type = 'single'
                    i += 1
                elif content[i+1] == '*':
                    in_comment = True
                    comment_type = 'multi'
                    i += 1
            elif c in ["'", '"', '`']:
                in_string = True
                quote_char = c
            elif c in counts:
                counts[c] += 1
        i += 1
    
    for k, v in counts.items():
        print(f"{k}: {v}")

count_tokens(sys.argv[1])
