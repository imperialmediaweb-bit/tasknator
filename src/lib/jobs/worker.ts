// Main worker entry point - runs all job processors
import "./workers/audit.worker";

console.log("Tasknator workers started");
console.log("Listening for jobs on queues: audit, plan, asset, export");
