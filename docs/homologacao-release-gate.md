# Gate da próxima homologação

Esta branch é a única área autorizada para desenvolvimento desta rodada. `main` não deve ser alterada sem aprovação explícita do Bruno.

## Escopo da entrega testável

### Novo layout
- hierarquia visual mais limpa;
- logos preservadas em boa resolução e com presença adequada;
- responsivo desktop/mobile;
- navegação sem perda de módulos existentes;
- estados vazio, carregando, erro e sucesso legíveis.

### Multi-perfil Bruno e Fernanda
- um login por pessoa;
- acesso autorizado aos modos Administrador e Consultor;
- troca de modo sem logout;
- modo Consultor não deve conceder permissões administrativas a usuários comuns;
- retorno ao modo Administrador preserva sessão.

### Avaliação de Evolução — Ciclo 1
Seguir `docs/avaliacao-evolucao-ciclo-1.md` e validar ponta a ponta antes da liberação.

### Cliente IA melhorado
- cliente responde de forma coerente ao histórico da conversa;
- perfis/cenários com dificuldade variável;
- cobre projeto x peça, projeto/fotos/medidas, cidade, prazo, investimento, arquiteto, concorrência, proposta por ambientes, objeção, follow-up e fechamento;
- não entrega preço, desconto, margem ou condição comercial como se fosse autorização da empresa;
- não troca item especificado sem autorização;
- ao comparar concorrência, exige equivalência de marca/produto/configuração/tecido/acabamento/especificação antes de avaliar preço;
- avaliação final aponta acertos, falhas e competência a desenvolver.

## Teste técnico obrigatório
Para cada fluxo alterado:
`entrada → processamento → gravação Supabase → leitura posterior → atualização da tela/dashboard → consequência correta`.

## Segurança de dados
Antes de qualquer migration, alteração de RLS, criação de usuário ou mudança estrutural no Supabase, confirmar que o banco utilizado pela homologação é isolado. Se compartilhar produção, não executar mudança destrutiva/estrutural sem autorização explícita.

## Ordem de execução
1. estabilizar Avaliação Ciclo 1;
2. novo layout sem regressão funcional;
3. multi-perfil;
4. Cliente IA;
5. smoke test geral;
6. disponibilizar URL de homologação ao Bruno;
7. somente após aprovação explícita considerar promoção para produção.

## Não regressão
Preservar: Universidade, CRM, Central de Ajuda, Cliente IA, Meu Dia, competências, missões, evolução, correção de português, Piloto Thiago, módulos de gestão e preparação para integração oficial Meta/WhatsApp.