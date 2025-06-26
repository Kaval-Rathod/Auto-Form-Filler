// Smart alternative field names
const altNames = {
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
  // Add more as needed
};

function getAllPossibleKeys(key) {
  key = key.toLowerCase();
  let keys = [key];
  if (altNames[key]) keys = keys.concat(altNames[key]);
  return keys;
}

function showNotification(msg) {
  const note = document.createElement('div');
  note.textContent = msg;
  note.style.position = 'fixed';
  note.style.top = '20px';
  note.style.right = '20px';
  note.style.background = '#323232';
  note.style.color = '#fff';
  note.style.padding = '12px 24px';
  note.style.borderRadius = '8px';
  note.style.zIndex = 9999;
  note.style.fontSize = '16px';
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 1800);
}

async function simulateUserInput(element, value) {
  element.focus();
  element.value = '';
  element.dispatchEvent(new Event('input', { bubbles: true }));
  // Only use setRangeText for types that support selection
  const supportedTypes = ['text', 'search', 'tel', 'url', 'password', 'number'];
  const type = (element.type || '').toLowerCase();
  if (element.setRangeText && (element.tagName === 'TEXTAREA' || supportedTypes.includes(type))) {
    for (let char of value) {
      element.setRangeText(char, element.value.length, element.value.length, 'end');
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 10));
    }
  } else {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function isSupportedField(el) {
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const type = (el.type || '').toLowerCase();
    return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
  }
  return false;
}

// Initialize form filler functionality (called when popup "Start" button is clicked)
function initializeFormFiller() {
  chrome.storage.sync.get(['fields'], ({ fields = {} }) => {
    if (!Object.keys(fields).length) {
      showNotification('No form fields configured! Please add fields in the options page.');
      return;
    }

    // Add 'Fill All' button at the top left corner
    const fillAllBtn = document.createElement('button');
    fillAllBtn.textContent = 'Fill All';
    fillAllBtn.type = 'button';
    fillAllBtn.className = 'form-fill-btn floating-fill-all';
    fillAllBtn.style.position = 'fixed';
    fillAllBtn.style.top = '20px';
    fillAllBtn.style.left = '20px';
    fillAllBtn.style.zIndex = 9999;
    fillAllBtn.onclick = async e => {
      e.preventDefault();
      let filledCount = 0;
      const inputs = document.querySelectorAll('input, textarea');
      for (const el of inputs) {
        if (!isSupportedField(el) || el.disabled) continue;
        const name = (el.name || el.id || '').toLowerCase();
        for (const key in fields) {
          if (name.includes(key.toLowerCase())) {
            await simulateUserInput(el, fields[key]);
            filledCount++;
            break;
          }
          for (const alt of getAllPossibleKeys(key)) {
            if (name.includes(alt)) {
              await simulateUserInput(el, fields[key]);
              filledCount++;
              break;
            }
          }
        }
      }
      showNotification(filledCount ? `Filled ${filledCount} fields!` : 'No matching fields found.');
    };
    document.body.appendChild(fillAllBtn);

    // Add Fill button next to each supported input/textarea in a visible container
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(el => {
      if (!isSupportedField(el) || el.disabled) return;
      if (el.dataset.formFillerBtn) return;
      el.dataset.formFillerBtn = '1';
  
      const btn = document.createElement('button');
      btn.textContent = 'Fill';
      btn.type = 'button';
      btn.className = 'form-fill-btn floating-fill';
      btn.onclick = async e => {
        e.preventDefault();
        const name = (el.name || el.id || '').toLowerCase();
        let filled = false;
        for (const key in fields) {
          if (name.includes(key.toLowerCase())) {
            await simulateUserInput(el, fields[key]);
            filled = true;
            break;
          }
          for (const alt of getAllPossibleKeys(key)) {
            if (name.includes(alt)) {
              await simulateUserInput(el, fields[key]);
              filled = true;
              break;
            }
          }
          if (filled) break;
        }
        showNotification(filled ? 'Field filled!' : 'No match for this field.');
      };
      // Position the button absolutely inside the input's parent for a floating look
      const wrapper = el.parentNode;
      wrapper.style.position = 'relative';
      btn.style.position = 'absolute';
      btn.style.top = '50%';
      btn.style.right = '8px';
      btn.style.transform = 'translateY(-50%)';
      btn.style.height = '28px';
      btn.style.padding = '0 14px';
      btn.style.fontSize = '13px';
      btn.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.10)';
      btn.style.background = '#2196f3';
      btn.style.color = '#fff';
      btn.style.borderRadius = '4px';
      btn.style.border = 'none';
      btn.style.fontWeight = 'bold';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'background 0.2s, box-shadow 0.2s';
      btn.onmouseover = () => { btn.style.background = '#1769aa'; };
      btn.onmouseout = () => { btn.style.background = '#2196f3'; };
      wrapper.appendChild(btn);
    });
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start_form_filler") {
    // Initialize the form filler when triggered from popup
    initializeFormFiller();
    showNotification('Form Filler activated!');
  }
});
  