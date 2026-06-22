export function numberToWordsINR(num) {
  if (num === 0) return 'Zero';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const numString = Math.floor(Math.abs(num)).toString();
  if (numString.length > 9) return 'Overflow'; // Max 99 Crores for now
  const n = ('000000000' + numString).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str +=
    n[1] !== '00'
      ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + ' Crore '
      : '';
  str +=
    n[2] !== '00'
      ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + ' Lakh '
      : '';
  str +=
    n[3] !== '00'
      ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + ' Thousand '
      : '';
  str +=
    n[4] !== '0'
      ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + ' Hundred '
      : '';
  str +=
    n[5] !== '00'
      ? (str !== '' ? 'and ' : '') +
        (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])])
      : '';
  return str.trim();
}
