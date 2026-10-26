# Parte B: defeitos encontrados

## A regra correta

1. Pagamento até o dia do vencimento: sem multa e sem juros.
2. Após o vencimento: multa única de 2% mais juros simples de 0,033% por dia corrido de atraso, ambos sobre o valor original.
3. Resultado final arredondado em centavos.

## Defeitos

### 1. O laço roda um dia a mais

O laço usa `i <= diasAtraso`. Com 0 dias de atraso, ele roda 1 vez; com 1 dia, roda 2 vezes, e assim por diante.

**Efeito para o associado:** quem paga no dia do vencimento é cobrado como se tivesse atrasado 1 dia. Quem atrasa 1 dia paga como se fossem 2.

### 2. A multa é cobrada todo dia

A conta `valor * 0.02` está dentro do laço, então a multa de 2% entra a cada volta.

**Efeito para o associado:** a multa deveria ser cobrada uma vez só. Com 10 dias de atraso, o associado paga 11 multas de 2%, ou seja, 22% de multa.

### 3. Os juros são compostos, e não simples

A conta usa `total * 0.00033`, e o `total` já inclui a multa e os juros dos dias anteriores.

**Efeito para o associado:** ele paga juros sobre juros e juros sobre a multa. A regra diz que os juros são sobre o valor original.

### 4. O resultado não é arredondado

A função devolve o número com todas as casas decimais.

**Efeito para o associado:** aparecem valores como 197,62260802011002, que não existem em dinheiro, e o valor cobrado pode não bater com o boleto.

### Observação

Se a data vier em um formato inválido, `diasAtraso` vira `NaN`, o laço não roda e a função devolve o valor sem acréscimo. Não é contra a regra, mas é um ponto de atenção: a data deve ser validada antes de chamar a função.

## Função corrigida

```typescript
function calcularValorAtualizado(
  valor: number,
  vencimento: string,
  dataPagamento: string
): number {
  const venc = new Date(vencimento);
  const pag = new Date(dataPagamento);
  //Calcula quantos dias corridos se passaram depois do vencimento
  const diasAtraso = Math.floor(
    (pag.getTime() - venc.getTime()) / 86400000
  );

  //Pagou até o vencimento não tem multa nem juros
  if (diasAtraso <= 0) {
    return Math.round(valor * 100) / 100;
  }

  //Multa de 2% cobrada uma vez só, sobre o valor original
  const multa = valor * 0.02;
  //Juros simples de 0,033% por dia, sempre sobre o valor original
  const juros = valor * 0.00033 * diasAtraso;

  //Soma tudo e arredonda em centavos
  return Math.round((valor + multa + juros) * 100) / 100;
}
```

## Valores para a mensalidade de R$ 189,90 com vencimento em 05/10/2026

| Pagamento | Dias de atraso | Função antiga | Valor correto |
| --- | --- | --- | --- |
| 01/10/2026 | 0 (adiantado) | 189,90 | **R$ 189,90** |
| 05/10/2026 | 0 | 193,760667 | **R$ 189,90** |
| 06/10/2026 | 1 | 197,62260802011002 | **R$ 193,76** |
| 15/10/2026 | 10 | 232,43747752225067 | **R$ 194,32** |

### Como chegar nos valores corretos

1. **01/10 e 05/10:** pagou até o vencimento, então fica o valor original: R$ 189,90.
2. **06/10 (1 dia):** multa de 189,90 × 2% = 3,798, mais juros de 189,90 × 0,033% × 1 = 0,062667. Total: 193,760667, arredondado para **R$ 193,76**.
3. **15/10 (10 dias):** multa de 3,798, mais juros de 189,90 × 0,033% × 10 = 0,62667. Total: 194,32467, arredondado para **R$ 194,32**.