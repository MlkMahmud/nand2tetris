module.exports.toBinary = (decimal) => {
  const binary = Number(decimal).toString(2);
  return `${binary}`.padStart(15, '0');
} 