const container = document.getElementById('fieldsContainer');
const addBtn = document.getElementById('addFieldBtn');
const saveBtn = document.getElementById('saveBtn');

// Track original values to detect changes
let originalValues = {};

// List of canonical autofill keys and their alternatives (should match content_script.js)
const autofillKeys = {
  name: ['fullname', 'full_name', 'yourname', 'your_name', 'firstlast', 'first_last', 'full name', 'first and last name'],
  fullname: ['name', 'full_name', 'yourname', 'your_name', 'firstlast', 'first_last', 'full name', 'first and last name'],
  firstname: ['first_name', 'givenname', 'given_name', 'forename', 'fname', 'first name'],
  middlename: ['middle_name', 'mname', 'middle name'],
  lastname: ['last_name', 'surname', 'familyname', 'family_name', 'lname', 'last name'],
  surname: ['last_name', 'lastname', 'familyname', 'family_name', 'lname', 'last name'],
  email: ['e-mail', 'mail', 'useremail', 'user_email', 'emailaddress', 'email_address', 'email id', 'emailid'],
  address: ['addr', 'location', 'street', 'address1', 'address2', 'homeaddress', 'home_address', 'residence', 'residential_address', 'house', 'flat', 'apartment'],
  phone: ['mobile', 'phone_number', 'phonenumber', 'contact', 'cell', 'cellphone', 'telephone', 'tel', 'mobile_number', 'mobile number', 'phone number'],
  number: ['num', 'contactnumber', 'contact_number', 'phone', 'mobile', 'phonenumber', 'phone_number', 'cell', 'cellphone', 'telephone', 'tel', 'mobile_number', 'mobile number', 'phone number'],
  city: ['town', 'municipality'],
  state: ['province', 'region', 'territory'],
  country: ['nation'],
  zipcode: ['postal', 'postalcode', 'zip', 'zip_code', 'postcode'],
  dob: ['dateofbirth', 'birthdate', 'birthday', 'date_of_birth'],
  password: ['passwd', 'pass', 'pwd', 'userpassword', 'user_password'],
  company: ['organization', 'organisation', 'workplace', 'business', 'employer'],
  university: ['university name', 'college', 'institute', 'school'],
  branch: ['department', 'major', 'stream'],
  course: ['cource', 'program', 'degree'],
  gender: ['sex'],
  // Add more as needed
};

function normalizeFieldName(input) {
  const cleaned = input.trim().toLowerCase();
  for (const [canonical, alts] of Object.entries(autofillKeys)) {
    if (canonical === cleaned) return canonical;
    if (alts.map(a => a.toLowerCase()).includes(cleaned)) return canonical;
  }
  return input.trim(); // fallback to user input if no match
}

function loadFields() {
  chrome.storage.sync.get(['fields'], ({ fields = {} }) => {
    container.innerHTML = '';
    originalValues = { ...fields }; // Store original values
    Object.entries(fields).forEach(([key, val]) => addFieldRow(key, val));
  });
}

function addFieldRow(key = '', val = '') {
  const row = document.createElement('div');
  row.className = 'field-row';
  
  const kInput = document.createElement('input');
  kInput.placeholder = 'field name';
  kInput.value = key;
  
  const vInput = document.createElement('input');
  vInput.placeholder = 'value';
  vInput.value = val;
  
  // Track changes to highlight edited fields
  const trackChanges = () => {
    const currentKey = normalizeFieldName(kInput.value);
    const originalValue = originalValues[currentKey];
    
    if (key === '' || val === '') {
      // New field
      row.classList.add('edited');
    } else if (currentKey !== key || vInput.value !== originalValues[key]) {
      // Changed field
      row.classList.add('edited');
    } else {
      // Unchanged field
      row.classList.remove('edited');
    }
  };
  
  kInput.addEventListener('input', trackChanges);
  vInput.addEventListener('input', trackChanges);
  
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.className = 'del';
  delBtn.onclick = () => row.remove();
  
  row.append(kInput, vInput, delBtn);
  container.appendChild(row);
  
  return row; // Return the row so it can be referenced
}

addBtn.addEventListener('click', () => {
  const newRow = addFieldRow('', '');
  newRow.classList.add('edited'); // Highlight new rows
});

saveBtn.addEventListener('click', () => {
  const fields = {};
  document.querySelectorAll('.field-row').forEach(row => {
    const [k, v] = row.querySelectorAll('input');
    if (k.value.trim()) fields[normalizeFieldName(k.value)] = v.value;
  });
  
  chrome.storage.sync.set({ fields }, () => {
    alert('Fields saved!');
    originalValues = { ...fields }; // Update original values
    
    // Remove highlighting from all rows
    document.querySelectorAll('.field-row').forEach(row => {
      row.classList.remove('edited');
    });
  });
});

document.addEventListener('DOMContentLoaded', loadFields);
