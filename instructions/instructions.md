# Instruções de uso: inKlan

### A aplicação tem 3 modos:

- Draw: Modo de desenho por linhas consecutivas;
- Grab: Modo de arrastar elementos já desenhados;
- Select: Modo de selecionar objetos para operações (atualmente, apenas remover).

### Modo Draw:

No modo draw o usuário pode construir objetos através de cliques que definem pontos.

Os pontos são interligados por segmentos de reta.

Ao concluir o desenho, o mesmo pode ser enviado para os demais clientes usando:
- Line: Envia como está;
- Polygon: Liga o último ponto ao primeiro e envia;

Além disso, há a opção de preencher o desenho, através da checkbox **Fill**.


As duas caixas de seleção de cor são usadas para definir as cores de
preenchimento (*fill*) e linha (*stroke*).

A opção de **Preview** permite ver como vai ficar um traço antes de clicar. Por
atualizar o canvas continuamente, esse modo é bastante custoso e **pode causar
lentidão**.

### Modo Grab:

Nesse modo o usuário pode clicar em objetos e arrastá-los pela cena, soltando o
 mouse na posição desejada.

A posição do objeto só é alterada ao soltar o mouse. Isso gera uma mensagem de
atualização para os clientes.

O objeto movido é o mais visível sob o cursor. A seleção de arestas sem
preenchimento é possível, mas precisa ser exata, pois o teste é feito por pixel.

### Modo Select:

No estado atual do código, esse modo serve para que objetos sejam selecionados e
 então deletados. O botão **Delete** tem essa utilidade.

### Atalhos:

A aplicação foi desenvolvida de forma a permitir atalhos de teclado intuitivos,
que agilizam a interação do usuário. Os atalhos estão explicitados nos próprios
 botões. **Use-os!**

### Capture Canvas:

Esse botão gera uma imagem do canvas e a fornece ao usuário que pode, então,
salvá-la.
