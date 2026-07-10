function getToday() {
  if (process.env.OVERRIDE_TODAY) {
    return new Date(process.env.OVERRIDE_TODAY);
  }
  return new Date();
}

function getPeriodForDate(date = getToday()) {
  const day = date.getDate();
  let year = date.getFullYear();
  let month = date.getMonth(); // 0-indexed

  if (day < 15) {
    // Tanggal < 15 berarti masih bagian dari periode yang mulai bulan sebelumnya
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const startDate = new Date(year, month, 15);

  let endMonth = month + 1;
  let endYear = year;
  if (endMonth > 11) {
    endMonth = 0;
    endYear += 1;
  }
  const endDate = new Date(endYear, endMonth, 14);

  return { periodKey, startDate, endDate };
}

function getNextPeriod(date = getToday()) {
  const current = getPeriodForDate(date);
  const nextStart = new Date(current.endDate);
  nextStart.setDate(nextStart.getDate() + 1);
  return getPeriodForDate(nextStart);
}

function getPeriodsList(count = 12, fromDate = getToday()) {
  const periods = [];
  let current = getPeriodForDate(fromDate);
  periods.push(current);

  for (let i = 1; i < count; i++) {
    const nextStart = new Date(current.endDate);
    nextStart.setDate(nextStart.getDate() + 1);
    current = getPeriodForDate(nextStart);
    periods.push(current);
  }

  return periods;
}

function formatPeriodLabel(period) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const startLabel = monthNames[period.startDate.getMonth()];
  const endLabel = monthNames[period.endDate.getMonth()];
  const year = period.endDate.getFullYear();
  return `${startLabel} - ${endLabel} ${year}`;
}

module.exports = { getPeriodForDate, getNextPeriod, getPeriodsList, formatPeriodLabel };