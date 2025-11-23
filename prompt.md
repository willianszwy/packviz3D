# Prompt do Visualizador 3D de Caixas e Itens

Desenvolva um visualizador 3D de caixas e itens usando JavaScript/Three.js conforme os requisitos abaixo.

## 1. Entrada via JSON
- Interface deve oferecer um campo (textarea) onde o usuário cola um JSON e clica em “Carregar”.
- Estrutura esperada:
```json
{
  "box": {
    "width": number,
    "height": number,
    "depth": number,
    "maxWeight": number,
    "position": { "x": number, "y": number, "z": number } // opcional; padrão (0,0,0)
  },
  "items": [
    {
      "id": "string",
      "name": "string",
      "width": number,
      "height": number,
      "depth": number,
      "weight": number,
      "position": { "x": number, "y": number, "z": number } // obrigatório
    }
  ]
}
```
- Todas as dimensões em centímetros; posições referenciadas ao centro da cena.
- Sem heurística automática: cada item deve ser renderizado exatamente na coordenada informada.
- Validar JSON e exibir mensagens claras quando:
  * JSON estiver malformado.
  * `position` estiver ausente nos itens.
  * Dimensões ou pesos inválidos (≤ 0).

## 2. Visualização Three.js
- Renderizar a caixa como paralelepípedo translúcido com textura “papelão” e face superior aberta.
- Renderizar itens como blocos sólidos coloridos; manter legenda/lista lateral mapeando cor ↔ item (nome, dimensões, peso).
- Exibir linhas e labels 3D indicando largura, profundidade e altura da caixa.
- Detectar itens “fora da caixa” (qualquer eixo ultrapassando limites considerando posição e dimensões):
  * Marcar na lista e destacar visualmente (por exemplo, deslocando o item para uma área lateral com rótulo).

## 3. Controles e UX
- Utilizar OrbitControls (rotação com arraste, zoom via scroll, pan com botão direito).
- Ajustar damping/limites de zoom para experiência suave.
- Instruções na UI explicando como manipular a cena.

## 4. Interface
- Campo textarea + botão “Carregar” para o JSON.
- Painel lateral listando itens (nome, dimensões, peso, cor).
- Mensagens de estado/erro destacando problemas de validação ou ausência de dados.

## 5. Arquitetura/Tecnologias
- HTML/CSS/JavaScript puro com módulos ES; usar import map para carregar Three.js (ex.: `"three"` e `"three/examples/jsm/..."`).
- Organizar código em funções/módulos separados:
  * Parsing/validação do JSON.
  * Construção de materiais/texturas.
  * Renderização e atualização de cena (caixa, itens, labels).
  * UI (formulário, lista de itens, mensagens).
- Garantir limpeza de recursos (geometrias, materiais) ao recarregar dados para evitar vazamentos.
