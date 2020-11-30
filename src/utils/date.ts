export const dateConverter = (date: Date): string => {
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  // return `${date.getFullYear()}年${month}月${day}日`;
  return `${date.getFullYear()}/${month}/${day}`;
};
