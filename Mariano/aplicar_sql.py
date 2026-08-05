"""
Aplica o supabase_setup.sql no banco do Supabase.

A senha NUNCA deve ser digitada aqui nem colada no chat.
Coloque-a no arquivo .env (na mesma pasta), no formato:

    DB_PASSWORD=suasenha

Depois rode:  python aplicar_sql.py
"""
import os
import pathlib
import sys

import psycopg2

PASTA = pathlib.Path(__file__).parent
PROJETO_REF = "qodoomggkesrukquhnbz"


def ler_senha():
    senha = os.environ.get("DB_PASSWORD")
    if senha:
        return senha
    env = PASTA / ".env"
    if env.exists():
        for linha in env.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha.startswith("DB_PASSWORD="):
                return linha.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def conectar(senha):
    tentativas = [
        ("conexao direta", dict(
            host=f"db.{PROJETO_REF}.supabase.co", port=5432,
            user="postgres", password=senha, dbname="postgres",
            sslmode="require", connect_timeout=15)),
        ("pooler sa-east-1", dict(
            host="aws-0-sa-east-1.pooler.supabase.com", port=5432,
            user=f"postgres.{PROJETO_REF}", password=senha, dbname="postgres",
            sslmode="require", connect_timeout=15)),
        ("pooler us-east-1", dict(
            host="aws-0-us-east-1.pooler.supabase.com", port=5432,
            user=f"postgres.{PROJETO_REF}", password=senha, dbname="postgres",
            sslmode="require", connect_timeout=15)),
    ]
    for nome, cfg in tentativas:
        try:
            conn = psycopg2.connect(**cfg)
            print(f"[ok] conectado via {nome}")
            return conn
        except Exception as e:
            print(f"[--] {nome} falhou: {str(e).strip().splitlines()[0]}")
    return None


def main():
    senha = ler_senha()
    if not senha:
        print("ERRO: senha nao encontrada.")
        print("Crie o arquivo .env nesta pasta com a linha:  DB_PASSWORD=suasenha")
        sys.exit(1)

    conn = conectar(senha)
    if conn is None:
        print("\nERRO: nao foi possivel conectar em nenhum host.")
        print("Se a senha estiver correta, use o SQL Editor do Supabase para rodar os arquivos SQL.")
        sys.exit(1)

    conn.autocommit = True
    for arquivo in ["supabase_setup.sql", "supabase_setup_2.sql"]:
        caminho = PASTA / arquivo
        if not caminho.exists():
            print(f"[--] {arquivo} nao encontrado, pulando.")
            continue
        sql = caminho.read_text(encoding="utf-8")
        with conn.cursor() as cur:
            cur.execute(sql)
        print(f"[ok] {arquivo} executado com sucesso.")
    conn.close()
    print("\n[ok] Todos os arquivos SQL foram aplicados.")


if __name__ == "__main__":
    main()
