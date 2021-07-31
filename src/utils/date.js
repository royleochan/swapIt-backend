const getCurrentDate = () => new Date();

const addMinutesToDate = (date, minutes) =>
  new Date(date.getTime() + minutes * 60000);

exports.getCurrentDate = getCurrentDate;
exports.addMinutesToDate = addMinutesToDate;
