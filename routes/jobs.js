const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobsNewSchema = require("../schemas/jobsNew.json");
const jobsUpdateSchema = require("../schemas/jobsUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json")

const router = new express.Router();

router.post("/",ensureLoggedIn, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, jobsNewSchema);
        if (!validator.valid){
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }
        const job = await Job.create(req.body)
        return res.status(201).json(job);

    } catch(err) {
        return next(err)
    }

});

router.patch("/:id",ensureAdmin, async function(req, res, next){
    try {
        const validator = jsonschema.validate(req.body, jobsUpdateSchema);
        if (!validator.valid){
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }
        const jobUpdate = await Job.update(req.params.id, req.body)
        return res.status(201).json(jobUpdate);

    } catch(err) {
        return next(err)
    }
});

router.get("/", async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobSearchSchema);
            if (!validator.valid){
                const err = validator.errors.map(e => e.stack);
                throw new BadRequestError(err);
            }
      const jobs = await Job.findAll(req.body);
      return res.json(jobs)
    } catch (err) {
      return next(err);
    }
  });

//   router.get("/:handle", async function(req, res, next) {
//     try {
//         const jobs = await Job.list(req.params.handle)
//         return res.json(jobs)
//     } catch (err) {

//     }
//   });

module.exports = router;