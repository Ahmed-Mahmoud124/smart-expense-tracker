'use strict';

/**
 * sendSuccess
 * Sends a 2xx JSON response with a standard envelope.
 *
 * @param {object} res        - Express response object
 * @param {*}      data       - Payload to include under the `data` key
 * @param {string} message    - Human-readable status message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = {
    success: true,
    message,
    ...(data !== null && { data }),
  };
  return res.status(statusCode).json(body);
};

/**
 * sendCreated
 * Shorthand for 201 Created responses.
 */
const sendCreated = (res, data = null, message = 'Resource created successfully') =>
  sendSuccess(res, data, message, 201);

/**
 * sendPaginated
 * Sends a paginated list response.
 *
 * @param {object} res
 * @param {Array}  rows       - Current page records
 * @param {number} total      - Total matching records (for the client to calculate pages)
 * @param {number} page       - Current page (1-based)
 * @param {number} limit      - Page size
 * @param {string} message
 */
const sendPaginated = (res, rows, total, page, limit, message = 'Data retrieved successfully') => {
  return res.status(200).json({
    success    : true,
    message,
    data       : rows,
    pagination : {
      total,
      page,
      limit,
      totalPages : Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * sendNoContent
 * 204 No Content — typically used for DELETE.
 */
const sendNoContent = (res) => res.status(204).send();

module.exports = { sendSuccess, sendCreated, sendPaginated, sendNoContent };