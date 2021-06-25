"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForPartialCompanySearch } = require("../helpers/sql");
const { matches } = require('z')
/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(data) {
    let { setCols, values } = sqlForPartialCompanySearch(
       data, 
       {
          name: "name",
          minEmployees: "minEmployees",
          maxEmployees: "maxEmployees"
       }
    );
    
    const apiFramework = 
      {
        name: ("name" in data), 
        minEmployees: ("minEmployees" in data),
        maxEmployees: ("maxEmployees" in data)
      }

    matches(apiFramework)
    (
      (x = {name: true, maxEmployees: true, minEmployees: true}) => {setCols = `WHERE ${setCols[0]} AND num_employees BETWEEN ${setCols[1]} AND ${setCols[2]}`},
      (x = {name: true, minEmployees: true}) => {setCols = `WHERE ${setCols[0]} AND num_employees >= ${setCols[1]}`},
      (x = {name: true, maxEmployees: true}) => {setCols = `WHERE ${setCols[0]} AND num_employees <= ${setCols[1]}`},
      (x = {name: true}) => {setCols = `WHERE ${setCols[0]}`},
      (x = {minEmployees: true, maxEmployees: true}) => {setCols = `WHERE num_employees >= ${setCols[0]} AND num_employees <= ${setCols[1]}`},
      (x = {maxEmployees: true}) => {setCols = `WHERE num_employees <= ${setCols[0]}`},
      (x = {minEmployees: true}) => {setCols = `WHERE num_employees >= ${setCols[0]}`}
    )

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${setCols}
           ORDER BY name`, values);
    return companiesRes;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    let companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);
    
        let jobsRes = await db.query(
        `SELECT id, 
        title, 
        salary, 
        equity
        FROM jobs
        WHERE company_handle = $1`,
        [handle])
    companyRes = companyRes.rows[0];
    jobsRes = jobsRes.rows
    companyRes["jobs"] = jobsRes  

    if (!companyRes) throw new NotFoundError(`No company: ${handle}`);

    return companyRes;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
