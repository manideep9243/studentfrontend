document.getElementById('rollNumberInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('searchButton').click();
  }
});

// Debounce function to limit rapid requests
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const handleSearch = debounce(() => {
  const rollNumber = document.getElementById('rollNumberInput').value.trim();
  const searchButton = document.getElementById('searchButton');

  if (!rollNumber) {
    alert('Please enter a roll number');
    return;
  }

  // Disable button to prevent multiple clicks
  searchButton.disabled = true;
  searchButton.textContent = 'Loading...';

  const dataContainer = document.getElementById('data-container');
  // dataContainer.innerHTML = '<p>Loading...</p>';

  fetch('https://studentbackend-mq3j.onrender.com/getResults', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rollNumber }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(rawData => {
      console.log('Raw data:', rawData);

      if (!rawData || rawData.length === 0) {
        dataContainer.innerHTML = '<p>No results found for the entered roll number.</p>';
        document.getElementById('status').textContent = 'N/A';
        document.getElementById('sgpa').textContent = 'N/A';
        return;
      }

      // Clean the keys in the data
      const data = rawData.map(cleanKeys);
      console.log('Cleaned data:', data);

      // Log the first item's keys to debug field names
      if (data.length > 0) {
        console.log('Keys in first cleaned item:', Object.keys(data[0]));
      }

      // Render table with results
      renderTable(data);

      // Calculate and display status and SGPA
      calculateStatusAndSGPA(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      let errorMessage = 'Failed to fetch data. Please try again later.';
      if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      } else if (error.message.includes('403') || error.message.includes('CORS')) {
        errorMessage = 'CORS error: The server is blocking the request. Please contact the administrator.';
      } else if (error.message.includes('400')) {
        errorMessage = 'No results found for the entered roll number.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
      dataContainer.innerHTML = `<p>${errorMessage}</p>`;
      document.getElementById('status').textContent = 'N/A';
      document.getElementById('sgpa').textContent = 'N/A';
    })
    .finally(() => {
      // Re-enable button
      searchButton.disabled = false;
      searchButton.textContent = 'Search';
    });
}, 500); // 500ms debounce delay

document.getElementById('searchButton').addEventListener('click', handleSearch);

// Function to clean keys in the data
function cleanKeys(obj) {
  const cleanedObj = {};
  Object.keys(obj).forEach(key => {
    // Preserve underscores in field names
    const cleanedKey = key.replace(/[^a-zA-Z0-9_]/g, '').trim();
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
        <td>${item.SUBCODE || 'N/A'}</td>
        <td>${item.SUBNAME || 'N/A'}</td>
        <td>${item.GRADE_LETTER || 'N/A'}</td>
        <td>${item.GRADE_POINT || '0'}</td>
        <td>${item.CREDITS || '0'}</td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  dataContainer.innerHTML = tableHTML;
}

// Function to calculate Pass/Fail status and SGPA
function calculateStatusAndSGPA(studentData) {
  const isFail = studentData.some(item => item.GRADE_LETTER === 'F' || item.GRADE_LETTER === 'ABSENT');
  const statusElement = document.getElementById('status');
  const sgpaElement = document.getElementById('sgpa');

  statusElement.textContent = isFail ? 'Fail' : 'Pass';
  statusElement.style.color = isFail ? 'red' : 'green';

  if (isFail) {
    sgpaElement.textContent = 'N/A';
  } else {
    let totalGradePoints = 0;
    let totalCredits = 0;

    studentData.forEach(item => {
      const gradePoint = parseFloat(item.GRADE_POINT) || 0;
      const credits = parseFloat(item.CREDITS) || 0;
      totalGradePoints += gradePoint * credits;
      totalCredits += credits;
    });

    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    sgpaElement.textContent = sgpa;
  }
}
