const { BadRequestError } = require("../expressError");
const { matches } = require('z')

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function isKey(key, obj){
  let keys = Object.keys(obj).map((x) => {
    return x
  });
  return keys.indexOf(key) !== -1;
}


function sqlForPartialCompanySearch(dataToSearch, jsToSql){

  const keys = Object.keys(jsToSql);
  if (keys.length === 0) throw new BadRequestError("No data");

  const array = []
  const valuesArray = []
  keys.forEach((key, idx) => {
    if(isKey(key, dataToSearch) === true){
      if (key === "name") {
        array.push(`${jsToSql[key] || key} LIKE '%' || $${idx + 1} || '%'`)
        valuesArray.push(dataToSearch[key])
      }
      else {
        array.push(`$${idx + 1}`)
        valuesArray.push(dataToSearch[key])
      }
    }
  });
console.log(array)
return {
setCols: array,
values: valuesArray
};
}

function sqlForPartialJobSearch(dataToSearch, jsToSql){

  const keys = Object.keys(dataToSearch);
  if (keys.length === 0) throw new BadRequestError("No data");

  const array = []
  const valuesArray = []
  keys.forEach((key, idx) => {
    if(isKey(key, dataToSearch) === true){
      if (key === "title") {
        array.push(`${jsToSql[key] || key} LIKE '%' || $${idx + 1} || '%'`)
        valuesArray.push(dataToSearch[key])
        console.log(`${jsToSql[key] || key} LIKE '%' || $${idx + 1} || '%'`)
      }
      if (key === "minSalary") {
        array.push(`${jsToSql[key] || key} >= $${idx + 1}`)
        valuesArray.push(dataToSearch[key])
        console.log(`${jsToSql[key] || key} >= $${idx + 1}`)
      }
      if (key === "hasEquity") {
        console.log("here")
        console.log(dataToSearch[key])
        if(dataToSearch[key] === true) {
          array.push(`${jsToSql[key] || key} > $${idx + 1}`)
          console.log(`${jsToSql[key] || key} > $${idx + 1}`)
          valuesArray.push(0)
        }
      }
    }
  });
console.log("array is")
console.log(array)
return {
setCols: array,
values: valuesArray
};
}

module.exports = { sqlForPartialUpdate, sqlForPartialCompanySearch, sqlForPartialJobSearch };
