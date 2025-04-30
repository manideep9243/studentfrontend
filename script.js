document.getElementById('rollNumberInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action
    document.getElementById('searchButton').click(); // Trigger the click event on the submit button
  }
});
document.getElementById('searchButton').addEventListener('click', () => {
  const rollNumber = document.getElementById('rollNumberInput').value.trim();

  if (!rollNumber) {
    alert('Please enter a roll number');
    return;
  }

  // Show loading message
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = '<p>Loading...</p>';

  fetch('http://localhost:3000/api/data') // Update URL if needed
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(rawData => {
      console.log('Raw data:', rawData);

      // Clean the keys in the data
      const data = rawData.map(cleanKeys);

      console.log('Cleaned data:', data);

      const sanitizedRollNumber = rollNumber.toString().trim();

      // Find data for the specific roll number
      const studentData = data.filter(item =>
        String(item.rollNumber || '').trim() === sanitizedRollNumber
      );

      console.log('Matched student data:', studentData);
      if (!studentData.length) {
        dataContainer.innerHTML = '<p>No results found for the entered roll number.</p>';
        document.getElementById('status').textContent = 'N/A';
        document.getElementById('sgpa').textContent = 'N/A';
        return;
      }

      // Render table with results
      renderTable(studentData);

      // Calculate and display status and SGPA
      calculateStatusAndSGPA(studentData);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      dataContainer.innerHTML = '<p>Failed to fetch data. Please try again later.</p>';
    });
});

// Function to clean keys in the data
function cleanKeys(obj) {
  const cleanedObj = {};
  Object.keys(obj).forEach(key => {
    // Remove unwanted characters and normalize key names
    const cleanedKey = key.replace(/[^\w]/g, '').trim();
    cleanedObj[cleanedKey] = obj[key];
  });
  return cleanedObj;
}

// Function to render table
function renderTable(studentData) {
  const dataContainer = document.getElementById('data-container');
  let tableHTML = `
    <table class="result-table">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Subject Name</th>
          <th>Grade</th>
          <th>Grade Point</th>
          <th>Credits</th>
        </tr>
      </thead>
      <tbody>
  `;

  studentData.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.SUBCODE}</td>
        <td>${item.SUBNAME}</td>
        <td>${item.GRADE_LETTER}</td>
        <td>${item.GRADE_POINT}</td>
        <td>${item.CREDITS}</td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  dataContainer.innerHTML = tableHTML;
}

// Function to calculate Pass/Fail status and SGPA
function calculateStatusAndSGPA(studentData) {
  const isFail = studentData.some(item => item.GRADE_LETTER === 'F' || item.GRADE_LETTER==='ABSENT');
  const statusElement = document.getElementById('status');
  const sgpaElement = document.getElementById('sgpa');

  // Update Pass/Fail status
  statusElement.textContent = isFail ? 'Fail' : 'Pass';
  statusElement.style.color = isFail ? 'red' : 'green';

  // Calculate SGPA
  if (isFail) {
    sgpaElement.textContent = 'N/A';
  } else {
    let totalGradePoints = 0;
    let totalCredits = 0;

    studentData.forEach(item => {
      const gradePoint = parseFloat(item.GRADE_POINT);
      const credits = parseFloat(item.CREDITS);
      totalGradePoints += gradePoint * credits;
      totalCredits += credits;
    });

    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    sgpaElement.textContent = sgpa;
  }
}
