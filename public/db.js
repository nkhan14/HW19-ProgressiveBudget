let db;
// new db request for a BudgetDB database
const request = window.indexedDB.open("BudgetDB", 1);

request.onupgradeneeded = function (event) {
  // object store called "BudgetStore" and turn on autoIncrement 
  const db = event.target.result;
  db.createObjectStore("BudgetStore", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log(`Woops! ${event.target.errorCode}.`);
};

function saveRecord(record) {
  // creating a transaction on the  db with all access[adding, editing, viewing, etc]
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  store.add(record);
}

// checks the database and pulls whatever is it and puts it in mongodb
function checkDatabase() {
  // opens a transaction on your BudgetStore db
  let transaction = db.transaction(["BudgetStore"], "readwrite");

  // access your BudgetStore 
  const store = transaction.objectStore("BudgetStore");

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            // opens another transaction 
            transaction = db.transaction(["BudgetStore"], "readwrite");

            // assigns the current store to a variable
            const currentStore = transaction.objectStore("BudgetStore");

            // clears existing entries 
            currentStore.clear();
          }
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);