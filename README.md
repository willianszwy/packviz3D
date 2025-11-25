# PackViz 3D

**Visualizador Avançado de Empacotamento e Logística em 3D**

O **PackViz 3D** é uma ferramenta web interativa desenvolvida para visualizar, simular e otimizar o posicionamento de cargas e itens dentro de caixas ou contêineres. Utilizando tecnologias web modernas e renderização 3D de alta performance, ele oferece uma interface intuitiva para profissionais de logística, desenvolvedores e entusiastas.

## 🌐 Demo Online

**[🚀 Acesse o PackViz 3D](https://willianszwy.github.io/packviz3D/)**

Experimente a aplicação diretamente no seu navegador, sem necessidade de instalação!

![PackViz 3D Screenshot](https://via.placeholder.com/800x450?text=PackViz+3D+Preview)

## 🚀 Funcionalidades Principais

- **Visualização 3D Interativa**: Renderização em tempo real de caixas e itens com controles de câmera orbitais (zoom, pan, rotação).
- **Sistema de Coordenadas Flexível**:
  - **Origem no Canto (0,0,0)**: Modo padrão, ideal para logística, onde o ponto zero é o canto inferior esquerdo da caixa.
  - **Origem no Centro**: Opção para visualizar coordenadas baseadas no centro geométrico.
- **Física e Simulação**:
  - **Gravidade**: Simule a queda de itens para testar a estabilidade do empilhamento.
  - **Colisões**: Detecção visual de sobreposição entre itens (brilho laranja e opacidade sólida).
- **Análise de Capacidade**:
  - Cálculo automático de peso total vs. capacidade máxima.
  - Indicadores visuais para itens que excedem os limites da caixa (vermelho/transparente).
- **Interface Moderna**:
  - Tema escuro/profissional.
  - Notificações (Toasts) para feedback de ações.
  - Lista lateral interativa sincronizada com a cena 3D.
- **Ferramentas de Produtividade**:
  - Carregamento via JSON.
  - Exemplos pré-configurados de diversos tamanhos.
  - Exportação de Screenshot.
  - Compartilhamento de estado via URL.

## 🛠️ Tecnologias

- **Three.js**: Motor gráfico 3D.
- **HTML5 / CSS3**: Estrutura e estilização responsiva.
- **JavaScript (ES6+)**: Lógica da aplicação (sem frameworks pesados).
- **Vite/Serve**: Para desenvolvimento local.

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js instalado (para usar o `npx`).
- Navegador moderno (Chrome, Firefox, Edge).

### Rodando Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/willianszwy/packviz3D.git
   cd packviz3D
   ```

2. Inicie o servidor local:
   ```bash
   npx serve
   ```
   *Ou use qualquer outro servidor estático de sua preferência (ex: `python -m http.server`, `live-server`).*

3. Acesse no navegador:
   Abra `http://localhost:3000` (ou a porta indicada pelo seu servidor).

## 📖 Como Usar

1. **Carregar Dados**:
   - Cole um JSON válido no painel esquerdo seguindo a estrutura abaixo.
   - Ou selecione um dos **Exemplos** no menu dropdown.

2. **Ajustar Visualização**:
   - Use o interruptor **"Origem no Canto (0,0,0)"** para alternar o sistema de coordenadas.
   - Clique em **"🌍 Gravidade"** para ativar a física.

3. **Interagir**:
   - **Clique** em um item na cena ou na lista para destacá-lo.
   - **Hover** (passar o mouse) mostra detalhes rápidos.

### Estrutura do JSON

O JSON de entrada deve conter um objeto `box` e uma lista de `items`.

```json
{
  "box": {
    "name": "Contêiner Padrão",
    "width": 100,      // Largura (X)
    "height": 100,     // Altura (Y)
    "depth": 100,      // Profundidade (Z)
    "maxWeight": 500,  // Capacidade máxima de peso
    "position": { "x": 0, "y": 0, "z": 0 } // Posição no mundo (geralmente 0,0,0)
  },
  "items": [
    {
      "id": "item-01",
      "name": "Caixa A",
      "width": 30,
      "height": 20,
      "depth": 30,
      "weight": 10,
      "position": { "x": 15, "y": 10, "z": 15 } // Coordenadas (Centro ou Canto dependendo da config)
    }
  ]
}
```

> **Nota:** Se a opção "Origem no Canto" estiver ativa (padrão), as coordenadas `position` dos itens devem ser relativas ao canto da caixa. O visualizador ajustará automaticamente.

## 🔗 Autoload via URL

Você pode compartilhar uma configuração específica codificando o JSON em Base64 e passando-o na URL:

`http://seusite.com/?payload=<JSON_BASE64>`

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Sinta-se à vontade para usar, modificar e distribuir.
