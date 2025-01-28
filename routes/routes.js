   // routes/routes.js
   const express = require("express");
   const htmlRoutes = require("./htmlRoutes"); // Ensure this path is correct
   const apiRoutes = require("./apiRoutes");

   const router = express.Router();

   // Use HTML routes
   router.use("/", htmlRoutes);

   // Use API routes
   router.use("/", apiRoutes);

   module.exports = router;