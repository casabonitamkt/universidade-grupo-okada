# Auditoria de homologação

A tabela isolada tem RLS ativo, mas o papel authenticated possui privilegio TRUNCATE, que nao respeita RLS. Antes de disponibilizar a tela de progresso autenticada, e necessario aprovar revogacao dos privilegios TRUNCATE, DELETE e outros desnecessarios. Nao executar migracao sem aprovacao expressa. Nenhum dado de producao foi alterado.
