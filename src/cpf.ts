//Exporta o limparCpf e remove tudo que não tem dígito
export function limparCpf(cpf: string): string {
    // Padrão regex que remove tudo que não é digito e substitui por ""
    return cpf.replace(/\D/g, "");
}
//Exporta o cpfValido e re
export function cpfValido(entrada: string): boolean {
    const cpf = limparCpf(entrada);

  //Recusar se não tiver 11 dígitos
    if (cpf.length !== 11) return false;
  //Jutar os números ver se tem o mesmo dígito mais de 10 vezes e finaliza.
    if (/^(\d)\1{10}$/.test(cpf)) return false;

//Caluladora de digito do CPF e no final somando tudo na variável soma
const calcularDigito = (base: string): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
        soma += Number(base[i]) * (base.length + 1 - i);
    }
  //Conferir se a soma está correta (CPF's Devolvem 2)
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  //Confere se o cálculo está correto comparando com os dois dígitos
    const digito1 = calcularDigito(cpf.slice(0, 9));
    const digito2 = calcularDigito(cpf.slice(0, 10));

    return digito1 === Number(cpf[9]) && digito2 === Number(cpf[10]);
}