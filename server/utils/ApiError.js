// Operational error with an HTTP status. Thrown by controllers, formatted by middleware/error.js.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
module.exports = ApiError;
