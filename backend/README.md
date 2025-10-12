# Pets Backend

Backend Django para o sistema de pets.

## Configuração

1. Instale as dependências:
```bash
poetry install --no-root
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Execute as migrações:
```bash
poetry run python manage.py migrate
```

4. Inicie o servidor:
```bash
poetry run python manage.py runserver
```
