import json
import urllib.request

URL = "https://qodoomggkesrukquhnbz.supabase.co"
KEY = "sb_publishable_kiVuH4RtOcfqkT7l7Ndl_w_59xjYLrQ"
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}


def call(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(URL + path, data=data, headers=H, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read().decode("utf-8", "replace")[:300]
    except Exception as e:
        try:
            corpo = json.loads(e.read().decode("utf-8", "replace"))
            return "ERRO", corpo.get("message", "")
        except Exception:
            return "ERRO", str(e)


print("== TABELAS ==")
for t in ["brinquedos", "doacoes", "apoiadores", "configuracoes"]:
    st, corpo = call(f"/rest/v1/{t}?select=*")
    print(f"  {t:15} {st}  {corpo[:120]}")

print("\n== BRINQUEDOS (coluna visivel + link) ==")
st, corpo = call("/rest/v1/brinquedos?select=nome,visivel,link")
print(f"  {st}  {corpo[:300]}")

print("\n== LOGIN ==")
print("  Mariano/nanobanana :", call("/rest/v1/rpc/verificar_login", "POST",
                                     {"p_usuario": "Mariano", "p_senha": "nanobanana"}))
print("  senha errada       :", call("/rest/v1/rpc/verificar_login", "POST",
                                     {"p_usuario": "Mariano", "p_senha": "xxx"}))
print("  admin_users vaza?  :", call("/rest/v1/admin_users?select=*"))
