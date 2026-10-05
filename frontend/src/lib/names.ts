// "Завгородній Валерій Вікторович" becomes "Завгородній В. В."
export function shortName(fullName: string): string {
  const [surname, ...rest] = fullName.trim().split(/\s+/)
  return [surname, ...rest.map((part) => `${part[0]}.`)].join(' ')
}
