# PackViz 3D

**Visualize, simule e otimize seu empacotamento em 3D**

Aplicação web interativa em HTML/CSS/JS (Three.js) que renderiza caixas e itens posicionados em 3D a partir de um JSON, com física, análise de espaço e detecção de colisões.

## Pre-requisitos
- Servir os arquivos via HTTP (ex.: `npx serve`, `http-server .`)
- Navegador moderno com suporte a ES Modules

## Uso
1. Abra `index.html` via um servidor local (ex.: `http://localhost:3000`).
2. Cole o JSON com os campos `box` e `items` na area de texto a esquerda.
3. Clique em **Carregar** para atualizar a cena.
4. Explore a visualizacao com OrbitControls (arraste para orbitar, scroll para zoom, botao direito para pan).
5. A lista lateral mostra itens, dimensoes, pesos e sinaliza aqueles "fora da caixa".

## Estrutura do JSON
```json
{
  "box": {
    "name": "opcional",
    "width": number,
    "height": number,
    "depth": number,
    "maxWeight": number,
    "position": { "x": number, "y": number, "z": number }
  },
  "items": [
    {
      "id": "string",
      "name": "string",
      "width": number,
      "height": number,
      "depth": number,
      "weight": number,
      "position": { "x": number, "y": number, "z": number }
    }
  ]
}
```

## Exemplos rapidos
- Use o dropdown **Exemplos** para preencher a area de texto com caixas pre-configuradas (12 tamanhos baseados na tabela fornecida).

## Autoload via Query String
E possivel abrir o viewer ja carregado passando o JSON na URL:
1. Codifique o JSON em Base64 (ou apenas URL-encode).
2. Abra `http://localhost:3000/?payload=<BASE64_DO_JSON>`.
3. O aplicativo decodifica e renderiza automaticamente.

Exemplo:
```
http://localhost:3000/?payload=eyJib3giOnsibmFtZSI6IkRlbW8iLCJ3aWR0aCI6MTIwLCJoZWlnaHQiOjgwLCJkZXB0aCI6MTAwLCJtYXhXZWlnaHQiOjE4MCwicG9zaXRpb24iOnsieCI6MCwieSI6MCwieiI6MH19LCJpdGVtcyI6W3siaWQiOiJpdGVtLTEiLCJuYW1lIjoiQ2FpeGEgbGl2cm9zIiwid2lkdGgiOjQwLCJoZWlnaHQiOjMwLCJkZXB0aCI6MzUsIndlaWdodCI6MTIsInBvc2l0aW9uIjp7IngiOi0xNSwieSI6LTEwLCJ6IjotNX19LHsiaWQiOiJpdGVtLTIiLCJuYW1lIjoiTW9uaXRvciIsIndpZHRoIjoyNSwiaGVpZ2h0Ijo1MCwiZGVwdGgiOjE1LCJ3ZWlnaHQiOjksInBvc2l0aW9uIjp7IngiOjIwLCJ5Ijo1LCJ6IjoyNX19XX0=
```

Exemplo com muitos itens (15 volumes):
```
http://localhost:3000/?payload=eyJib3giOnsibmFtZSI6IkNhaXhhIE1lZ2EgQ2FyZ2EiLCJ3aWR0aCI6MTgwLCJoZWlnaHQiOjEyMCwiZGVwdGgiOjE0MCwibWF4V2VpZ2h0Ijo0NTAsInBvc2l0aW9uIjp7IngiOjAsInkiOjAsInoiOjB9fSwiaXRlbXMiOlt7ImlkIjoiaXRlbS0wMSIsIm5hbWUiOiJQYWxldGUgQSIsIndpZHRoIjo2MCwiaGVpZ2h0IjoyMCwiZGVwdGgiOjcwLCJ3ZWlnaHQiOjQ1LCJwb3NpdGlvbiI6eyJ4IjotNDAsInkiOi0zNSwieiI6LTMwfX0seyJpZCI6Iml0ZW0tMDIiLCJuYW1lIjoiQ2FpeGEgTGF0ZXJhbCIsIndpZHRoIjo0MCwiaGVpZ2h0IjozNSwiZGVwdGgiOjUwLCJ3ZWlnaHQiOjI4LCJwb3NpdGlvbiI6eyJ4IjozNSwieSI6LTMyLCJ6IjotNDV9fSx7ImlkIjoiaXRlbS0wMyIsIm5hbWUiOiJSb2xvIENhYm9zIiwid2lkdGgiOjMwLCJoZWlnaHQiOjMwLCJkZXB0aCI6MzAsIndlaWdodCI6MTIsInBvc2l0aW9uIjp7IngiOi0xMCwieSI6LTQwLCJ6Ijo0NX19LHsiaWQiOiJpdGVtLTA0IiwibmFtZSI6Ik1vbml0b3IgQ3Vydm8iLCJ3aWR0aCI6MjUsImhlaWdodCI6NTUsImRlcHRoIjoyMCwid2VpZ2h0IjoxMCwicG9zaXRpb24iOnsieCI6NDUsInkiOjUsInoiOjMwfX0seyJpZCI6Iml0ZW0tMDUiLCJuYW1lIjoiS2l0IEZlcnJhbWVudGFzIiwid2lkdGgiOjM1LCJoZWlnaHQiOjI1LCJkZXB0aCI6MjUsIndlaWdodCI6MTgsInBvc2l0aW9uIjp7IngiOi01NSwieSI6LTEwLCJ6IjoyMH19LHsiaWQiOiJpdGVtLTA2IiwibmFtZSI6IlR1Ym9zIFBWQyIsIndpZHRoIjoyMCwiaGVpZ2h0Ijo4MCwiZGVwdGgiOjIwLCJ3ZWlnaHQiOjE2LCJwb3NpdGlvbiI6eyJ4IjowLCJ5IjoxMCwieiI6LTYwfX0seyJpZCI6Iml0ZW0tMDciLCJuYW1lIjoiTWFsZXRhIEVxdWlwLiIsIndpZHRoIjozMCwiaGVpZ2h0IjoyNSwiZGVwdGgiOjQ1LCJ3ZWlnaHQiOjIwLCJwb3NpdGlvbiI6eyJ4Ijo1NSwieSI6LTE1LCJ6Ijo1fX0seyJpZCI6Iml0ZW0tMDgiLCJuYW1lIjoiUGFjb3RlIEVzcHVtYXMiLCJ3aWR0aCI6NzAsImhlaWdodCI6MTUsImRlcHRoIjo0MCwid2VpZ2h0IjoxNCwicG9zaXRpb24iOnsieCI6LTIwLCJ5IjotNTAsInoiOjEwfX0seyJpZCI6Iml0ZW0tMDkiLCJuYW1lIjoiTWljcm9vbmRhcyIsIndpZHRoIjo0NSwiaGVpZ2h0IjozNSwiZGVwdGgiOjQwLCJ3ZWlnaHQiOjI1LCJwb3NpdGlvbiI6eyJ4IjoxNSwieSI6LTE1LCJ6IjotNX19LHsiaWQiOiJpdGVtLTEwIiwibmFtZSI6Ik1vbml0b3IgUmVzZXJ2YSIsIndpZHRoIjoyNSwiaGVpZ2h0Ijo1NSwiZGVwdGgiOjE1LCJ3ZWlnaHQiOjksInBvc2l0aW9uIjp7IngiOi02MCwieSI6MCwieiI6LTM1fX0seyJpZCI6Iml0ZW0tMTEiLCJuYW1lIjoiQ2FpeGEgTWl1ZG9zIiwid2lkdGgiOjIwLCJoZWlnaHQiOjE1LCJkZXB0aCI6MjUsIndlaWdodCI6NiwicG9zaXRpb24iOnsieCI6LTUsInkiOjAsInoiOjB9fSx7ImlkIjoiaXRlbS0xMiIsIm5hbWUiOiJDYWl4YSBSZWZvcmNvIiwid2lkdGgiOjUwLCJoZWlnaHQiOjQwLCJkZXB0aCI6NDUsIndlaWdodCI6MzIsInBvc2l0aW9uIjp7IngiOjMwLCJ5IjotNDUsInoiOjM1fX0seyJpZCI6Iml0ZW0tMTMiLCJuYW1lIjoiUm9sbyBUZWNpZG9zIiwid2lkdGgiOjI1LCJoZWlnaHQiOjg1LCJkZXB0aCI6MjAsIndlaWdodCI6MTUsInBvc2l0aW9uIjp7IngiOi0zNSwieSI6MjAsInoiOjUwfX0seyJpZCI6Iml0ZW0tMTQiLCJuYW1lIjoiQ2FpeGEgR291cm1ldCIsIndpZHRoIjozNSwiaGVpZ2h0IjozMCwiZGVwdGgiOjM1LCJ3ZWlnaHQiOjE5LCJwb3NpdGlvbiI6eyJ4Ijo1LCJ5IjoyNSwieiI6LTI1fX0seyJpZCI6Iml0ZW0tMTUiLCJuYW1lIjoiTWFsZXRhIFNlZ3VyYW5jYSIsIndpZHRoIjo0NSwiaGVpZ2h0IjoyMCwiZGVwdGgiOjM1LCJ3ZWlnaHQiOjE3LCJwb3NpdGlvbiI6eyJ4IjotNDUsInkiOjE1LCJ6IjoyNX19XX0=
```

## Controles adicionais
- **Resetar visualizacao** reposiciona a camera.
- O resumo acima do canvas mostra nome/dimensoes/peso total/capacidade.
- Itens fora dos limites recebem contorno vermelho e tag "FORA DA CAIXA".

## Estrutura do projeto
- `index.html`: layout e import map.
- `styles.css`: tema sobrio (tons de cinza, bordas retas).
- `app.js`: parsing, Three.js, UI, exemplos e query string.

Contribuicoes ou ajustes adicionais podem ser feitos editando esses arquivos diretamente.
