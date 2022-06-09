export const generateHash = () => {
  return Math.random().toString(16).substring(2, 14);
};

export const generateHexColor = (): string => {
  const [a, b, c] = [
    `${Math.round(Math.random() * 255).toString(16)}00`.substring(0, 2),
    `${Math.round(Math.random() * 255).toString(16)}00`.substring(0, 2),
    `${Math.round(Math.random() * 255).toString(16)}00`.substring(0, 2),
  ];

  return `#${a}${b}${c}`;
};

export function getLastItemsFromArray<T>(items: T[], count: number) {
  return items.slice(
    items.length > count ? items.length - count : 0,
    items.length
  );
}
