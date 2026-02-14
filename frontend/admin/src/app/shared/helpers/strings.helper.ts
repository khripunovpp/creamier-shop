// remove except letters in all cases numbers - : ( ) spaces
export const removeAllNonLetters = (str: string) => {
  return str.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-:()]/g, '');
}

export const removeAllNonMathSymbols = (str: string) => {
  return String(str || '')
    .replace(/[^0-9%.,+\-*/^() ]/g, '')  // разрешаем цифры, буквы, %, ., ,, + - * / ^ скобки и пробел
    .replace(',', '.')                           // заменяем запятую на точку
}

export const toString = (value: any) => {
  return String(value || '').trim();
}
