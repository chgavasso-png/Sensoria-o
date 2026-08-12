import os
import shutil

base_path = r'c:\Users\chgav\OneDrive\Desktop\Projetos\Mariano'

# Criar pasta assets
os.makedirs(os.path.join(base_path, 'assets', 'images'), exist_ok=True)

# Copiar imagens
mappings = [
    ('pics\\3.jpeg', 'assets\\images\\neurodiversity.jpeg'),
    ('pics\\4.jpeg', 'assets\\images\\inclusion.jpeg'),
    ('pics\\5.jpeg', 'assets\\images\\brain.jpeg'),
    ('pics\\6.jpeg', 'assets\\images\\idea.jpeg'),
]

for src, dst in mappings:
    src_path = os.path.join(base_path, src)
    dst_path = os.path.join(base_path, dst)
    shutil.copy2(src_path, dst_path)
    print(f'Copiado: {dst}')

print('Assets criados com sucesso!')
