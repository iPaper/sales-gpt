const URL = "http://salesgpt.ipaper-dev.io:3000";
const allTextAreas = document.querySelectorAll("textarea");
const allButtons = document.querySelectorAll("button");
const spinner = document.querySelector("#loading-spinner");
const formSpinner = document.querySelector("#form-loading-spinner");

const disableButtons = (disable) => {
  allButtons.forEach((button) => {
    if (disable) {
      button.classList.add("disabled");
      button.disabled = true;
    } else {
      button.classList.remove("disabled");
      button.disabled = false;
    }
  });
};

const checkEmptyTextAreas = () => {
  let isEmpty = false;
  allTextAreas.forEach((textArea) => {
    if (textArea.value.trim() === "") {
      isEmpty = true;
    }
  });
  return isEmpty;
};

const loadDefaultInstructions = async () => {
  try {
    const response = await fetch(`${URL}/defaultInstructions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const defaultSettings = JSON.parse(await response.text());
    allTextAreas.forEach((textArea) => {
      textArea.value = defaultSettings[textArea.id];
    });

    window.alert("Instructions loaded");
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};

const loadSavedInstructions = async () => {
  try {
    const response = await fetch(`${URL}/userSavedInstructions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const userInstructions = JSON.parse(await response.text());

    allTextAreas.forEach((textArea) => {
      textArea.value = userInstructions[textArea.id];
    });

    window.alert("Instructions loaded");
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};

const updateUserInstructions = async (isForm = false) => {
  if (checkEmptyTextAreas()) {
    window.alert("Please fill in all the text areas.");
    return;
  }

  const objToSend = {};

  allTextAreas.forEach((textArea) => {
    objToSend[textArea.id] = textArea.value = textArea.value.replace(
      /\n/g,
      " "
    );
  });

  try {
    await fetch(`${URL}/updateUserInstructions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objToSend),
    });
    if (!isForm) window.alert("Instructions loaded");
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
};

async function submitForm() {
  if (checkEmptyTextAreas()) {
    window.alert("Please fill in all the text areas.");
    return;
  }

  disableButtons(true);
  formSpinner.style.display = "inline-block";

  // updateUserInstructions(true);

  const form = document.querySelector("#form");
  const formData = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const blob = await response.blob();

    // Create a URL for the Blob
    const url = window.URL.createObjectURL(blob);

    // Create an anchor element and trigger the download
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "list.xlsx"; // Set the desired file name and extension
    document.body.appendChild(a);
    a.click();

    // Revoke the object URL to free up memory
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  } finally {
    formSpinner.style.display = "none";
    disableButtons(false);
  }
}

// loadDefaultInstructions();

const isValidURL = (url) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.?)+[a-zA-Z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-zA-Z\\d%@_.~+&:]*)*" + // port and path
      "(\\?[;&a-zA-Z\\d%@_.,~+&:=-]*)?" + // query string
      "(\\#[-a-zA-Z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(url);
};

const runCheck = async () => {
  const urlToCheck = document.querySelector("#urlInput").value;
  const websiteInfo = document.querySelector("#websiteInfo");

  if (!isValidURL(urlToCheck)) {
    spinner.style.display = "none";
    window.alert("Check url format");
    return;
  }

  if (checkEmptyTextAreas()) {
    window.alert("Please fill in all the text areas.");
    return;
  }

  spinner.style.display = "block";
  disableButtons(true);

  try {
    await updateUserInstructions(true);

    const response = await fetch(`${URL}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: urlToCheck }),
    });

    const { answer } = await response.json();

    websiteInfo.innerHTML = `
        <ul>
          <li><strong>Website:</strong> ${answer.url}</li>
          <li><strong>Monthly or more often catalogs:</strong> ${answer.monthlyOrMoreCatalogs}</li>
          <li><strong>Business model:</strong> ${answer.model}</li>
          <li><strong>Online:</strong> ${answer.online}</li>
          <li><strong>Business type:</strong> ${answer.type}</li>
       </ul>
         `;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  } finally {
    disableButtons(false);
    spinner.style.display = "none";
  }
};

const setListenerAndFunctions = async (id, functionToRun) => {
  const btn = document.querySelector(`#${id}`);
  btn.addEventListener("click", async (event) => {
    event.preventDefault();
    await functionToRun(event);
  });
};

setListenerAndFunctions("check", runCheck);
setListenerAndFunctions("uploadBtn", submitForm);
setListenerAndFunctions("loadDefault", loadDefaultInstructions);
setListenerAndFunctions("loadSavedInstructions", loadSavedInstructions);
setListenerAndFunctions("updateUserInstructions", updateUserInstructions);
