let delimiters = /[;,]/;
let newLine = '\n'
const dataset = JSON.parse(localStorage.getItem('chosen-dataset'))
const text = dataset.generalInfo.fileContent;
let table = document.getElementById('table');



function toTable(text) {
    while (table.lastElementChild) {
        table.removeChild(table.lastElementChild);
    }

    let rows = text.split(newLine);
    let htr = document.createElement('tr');
    let headers = rows.shift().trim().split(delimiters);

    headers.forEach(function (h) {
        let th = document.createElement('th');
        let ht = h.trim();

        if (!ht) {
            return;
        };

        th.textContent = ht;
        htr.appendChild(th);
    });

    table.appendChild(htr);
    let rtr;
    
    rows.forEach(function (r) {
        r = r.trim();
        if (!r) {
            return;
        }
        
        let cols = r.split(delimiters);

        if (cols.length == 0) {
            return;
        }

        rtr = document.createElement('tr');

        cols.forEach(function(c) {
            let td = document.createElement('td');
            let tc = c.trim();

            td.textContent = tc;
            rtr.appendChild(td);
        });
        table.appendChild(rtr);
    })
}

toTable(text);

function chooseFeatures(text) {
    let rows = text.split(newLine);
    let headers = rows.shift().trim().split(delimiters);
    const warningBox = document.getElementById('feature-checkbox-container');
    for (let i = 1; i<headers.length; i++) {
        const template = document.getElementById('feature-template');
        const clone = document.importNode(template.content, true);
        const checkBox = clone.querySelector('.feature-checkbox');
        checkBox.id = 'feature-checkbox-' + i;
        const label = clone.querySelector('.feature-label');
        label.setAttribute('for', checkBox.id);
        label.textContent = headers[i].trim();
        warningBox.appendChild(clone);
    }
}

function getFeatureWarnings() {
    document.getElementById('submit').addEventListener('click', function(event) {
        event.preventDefault();
        let rows = text.split(newLine);
        let headers = rows.shift().trim().split(delimiters);
        let featureList = [];
        for (let i = 1; i<headers.length; i++) {
            featureList.push(headers[i].trim());
        }
        let featureWarnings = dataset.advice.featureSpecificWarnings;
        let container = document.getElementById('select-feature-output-container');
        let selectedFeatures = new Set();
        document.querySelectorAll('.feature-checkbox').forEach(function(checkbox, index) {
            if (checkbox.checked) {
                selectedFeatures.add(checkbox.labels[0].textContent.trim());
            }
        });
       selectedFeatures.forEach(function(selectedFeature) {
            const featureSec = document.getElementById('feature-sec-template');
            const clone = document.importNode(featureSec.content, true);
            const div = clone.querySelector('.feature-sec');
            const name = clone.querySelector('.feature-output-name');
            name.textContent = selectedFeature;
            featureWarnings.forEach(function (featureWarning) {
                if (featureWarning.feature == selectedFeature) {
                    const warningTemplate = document.getElementById('feature-warning-output-template');
                    const warningClone = document.importNode(warningTemplate.content, true);
                    warningClone.querySelector('.feature-warning-output').textContent = featureWarning.warning;
                    div.append(warningClone);
                }
            });
            container.append(clone);
       });
    });
}

chooseFeatures(text);
getFeatureWarnings();