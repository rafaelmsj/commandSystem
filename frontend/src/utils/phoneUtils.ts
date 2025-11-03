/**
 * Utilitários para formatação de números de telefone brasileiros
 */

/**
 * Formata um número de telefone brasileiro em tempo real
 * Suporta formatos: (xx)xxxx-xxxx e (xx)xxxxx-xxxx
 * @param value - String com o número a ser formatado
 * @returns String formatada
 */
export const formatPhoneNumber = (value: string): string => {
    // Remove todos os caracteres que não são números
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (máximo para telefones brasileiros)
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a formatação baseada no tamanho
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)})${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      // Formato para telefone fixo: (xx)xxxx-xxxx
      return `(${limitedNumbers.slice(0, 2)})${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      // Formato para celular: (xx)xxxxx-xxxx
      return `(${limitedNumbers.slice(0, 2)})${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };
  
  /**
   * Remove toda a formatação do número de telefone
   * @param value - String com o número formatado
   * @returns String apenas com números
   */
  export const cleanPhoneNumber = (value: string): string => {
    return value.replace(/\D/g, '');
  };
  
  /**
   * Formata um número para exibição (adiciona formatação se não tiver)
   * @param value - String com o número
   * @returns String formatada para exibição
   */
  export const displayPhoneNumber = (value: string): string => {
    const cleanNumber = cleanPhoneNumber(value);
    return formatPhoneNumber(cleanNumber);
  };
  
  /**
   * Valida se um número de telefone brasileiro está completo
   * @param value - String com o número
   * @returns boolean indicando se é válido
   */
  export const isValidPhoneNumber = (value: string): boolean => {
    const cleanNumber = cleanPhoneNumber(value);
    // Telefone fixo: 10 dígitos (xx + 8 dígitos)
    // Celular: 11 dígitos (xx + 9 dígitos)
    return cleanNumber.length === 10 || cleanNumber.length === 11;
  };
  
  /**
   * Handler para input de telefone com formatação em tempo real
   * @param e - Evento de mudança do input
   * @param setter - Função para atualizar o estado
   */
  export const handlePhoneInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setter(formattedValue);
  };
  