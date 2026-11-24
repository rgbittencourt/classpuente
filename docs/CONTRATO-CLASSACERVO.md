# Contrato entre ClassAcervo e ClassPuente

Cada aula publicável pode fornecer um pequeno manifesto JSON. O manifesto informa ao ClassPuente tudo que ele precisa para preparar a atividade Moodle, sem exigir que o professor copie endereços ou parâmetros técnicos.

Quando o ClassAtelier publica um curso, ele gera um único `classpuente.json` na raiz. Esse arquivo lista as aulas com caminhos relativos, permitindo que o mesmo pacote funcione em qualquer conta, repositório ou pasta do GitHub Pages. O ClassPuente resolve automaticamente cada caminho usando o endereço do manifesto.

## Campos

- `schemaVersion`: versão do contrato.
- `source.catalog`: catálogo de origem, normalmente `ClassAcervo`.
- `lesson.id`: identificador permanente da aula.
- `lesson.title`: título apresentado ao professor.
- `lesson.url`: endereço público da aula.
- `lesson.contentVersion`: versão do conteúdo, sem alterar a identidade da aula.
- `classnotlibro.enabled`: escolha feita durante a preparação no ClassAtelier.
- `classnotlibro.launchUrl`: endpoint LTI usado pelo ClassPuente.

## Princípio importante

O ClassAtelier registra somente a intenção pedagógica: **esta aula terá ClassNotlibro ou não**. Ele não configura o Moodle e não precisa conhecer salas, alunos ou credenciais.

O ClassAcervo guarda e publica o manifesto junto da aula. O ClassPuente lê esse manifesto e realiza a integração com a sala escolhida.

## Identidade e atualização

`lesson.id` permanece estável mesmo quando o HTML muda. `contentVersion` identifica a edição publicada. Isso permite ao ClassPuente detectar que uma aula já existe na sala e oferecer atualização, em vez de criar cópias indefinidamente.

## Privacidade

O manifesto não contém alunos, anotações, cookies, senhas ou chaves privadas.


