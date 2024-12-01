localStorage.clear();

let datasets = JSON.parse(localStorage.getItem('datasets')) || [];
let currentDataset = JSON.parse(localStorage.getItem('currentDataset')) || {};
let id = 0;
function extractWords(cleanDescription) {
  let words = cleanDescription.split(/\s+/);
  words = words.filter(function(word) {
    return word.length > 0;
  });
  return words;
}

function addDataset() {
  let selectedMonth = document.getElementById('month-dropdown').value;
  let selectedDay = document.getElementById('day-dropdown').value;
  let selectedYear = document.getElementById('year-dropdown').value;

  currentDataset = {
    id: id,
    fileContent: localStorage.getItem("file-content"),
    month: selectedMonth,
    day: selectedDay,
    year: selectedYear
  };

  id++;
  datasets.push(currentDataset);
    localStorage.setItem('datasets', JSON.stringify(datasets));
    currentDataset = {};
}
