const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForPartialJobSearch } = require("../helpers/sql");
const { matches } = require('z')

class Job{
    static async create({ title, salary, equity, company_handle }){
        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING title, salary, equity, company_handle AS "handle"`,
          [
            title,
            salary,
            equity,
            company_handle,
          ],
      );
      const job = result.rows[0];
  
      return job;
    }

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
              title: "title",
              salary: "salary",
              equity: "equity"
            });
        const jobVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE Jobs 
                          SET ${setCols} 
                          WHERE id = ${jobVarIdx} 
                          RETURNING title, 
                                    salary, 
                                    equity`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job with id: ${id}`);
    
        return job;
      }

    static async findAll(data){
        let { setCols, values } = sqlForPartialJobSearch(
            data, 
            {
               title: "title",
               minSalary: "salary",
               hasEquity: "equity"
            }
         );
         
         const apiFramework = 
           {
             title: ("title" in data), 
             minSalary: ("minSalary" in data),
             hasEquity: ("hasEquity" in data && data["hasEquity"] === true)
           }
           console.log(apiFramework)
     
         matches(apiFramework)
         (
           (x = {title: true, minSalary: true, hasEquity: true}) => {setCols = `WHERE ${setCols[0]} AND ${setCols[1]} AND ${setCols[2]}`},
           (x = {title: true, minSalary: true}) => {setCols = `WHERE ${setCols[0]} AND ${setCols[1]}`},
           (x = {title: true, hasEquity: true}) => {setCols = `WHERE ${setCols[0]} AND ${setCols[1]}`},
           (x = {title: true}) => {setCols = `WHERE ${setCols[0]}`},
           (x = {minSalary: true, hasEquity: true}) => {setCols = `WHERE ${setCols[0]} AND ${setCols[1]}`},
           (x = {hasEquity: true}) => {setCols = `WHERE ${setCols[0]}`},
           (x = {minSalary: true}) => {setCols = `WHERE ${setCols[0]}`}
         )
     
         const jobsRes = await db.query(
               `SELECT id,
                       title,
                       salary,
                       equity,
                       company_handle
                FROM jobs
                ${setCols}
                ORDER BY title`, values);
         return jobsRes;
    }
    
}
module.exports = Job;
